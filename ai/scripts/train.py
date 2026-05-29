"""
ParkGuard detection model training script.

Trains yolo26n on the combined plant/animal/human dataset for real-time
park compliance monitoring. Optimized for mobile deployment where inference
speed is critical and objects appear at varying distances outdoors.

Usage:
    python ai/train.py                   # train on existing balanced dataset (or raw if none)
    python ai/train.py --prepare         # rebuild balanced dataset, then train
    python ai/train.py --resume          # resume from last checkpoint
    python ai/train.py --epochs 150      # override epoch count
"""

import argparse
import random
import shutil
from pathlib import Path

import cv2
import numpy as np
from ultralytics import YOLO


# ── Paths ──────────────────────────────────────────────────────────────────────
ROOT         = Path(__file__).parent
MODELS_DIR   = ROOT / "models"
DATASET_ROOT = ROOT.parent / "dataset"
DATA_YAML    = DATASET_ROOT / "combined.yaml"
BALANCED_YAML = DATASET_ROOT / "combined_balanced.yaml"
BASE_MODEL   = ROOT / "best.pt"

HUMAN_CLASS_ID      = 2
HUMAN_INSTANCE_CAP  = 5000   # max human instances kept in train split
PLANT_AUG_MULTIPLIER = 1.5     # extra augmented copies generated per plant image


# ── Dataset balancing ──────────────────────────────────────────────────────────

def _count_class_instances(label_path: Path, class_id: int) -> int:
    if not label_path.exists():
        return 0
    return sum(1 for ln in label_path.read_text().splitlines() if ln and int(ln.split()[0]) == class_id)


def _flip_labels_horizontal(lines: list[str]) -> list[str]:
    out = []
    for ln in lines:
        p = ln.split()
        out.append(f"{p[0]} {1.0 - float(p[1]):.6f} {p[2]} {p[3]} {p[4]}")
    return out


def _adjust_brightness(img: np.ndarray, factor: float) -> np.ndarray:
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:, :, 2] = np.clip(hsv[:, :, 2] * factor, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)


def _augment_plants(src_img_dir: Path, src_lbl_dir: Path,
                    dst_img_dir: Path, dst_lbl_dir: Path,
                    multiplier: int, rng: random.Random) -> int:
    """Write `multiplier` augmented copies of every plant image. Returns count added."""
    augmentations = [
        # (image_fn, label_fn)
        (lambda img, _: cv2.flip(img, 1),                       _flip_labels_horizontal),
        (lambda img, r: _adjust_brightness(img, r.uniform(0.6, 1.4)), lambda lns: lns),
    ]
    added = 0
    for img_path in sorted(src_img_dir.glob("*.*")):
        lbl_path = src_lbl_dir / (img_path.stem + ".txt")
        if not lbl_path.exists():
            continue
        img = cv2.imread(str(img_path))
        if img is None:
            continue
        orig_lines = lbl_path.read_text().strip().splitlines()
        for i in range(multiplier):
            img_fn, lbl_fn = augmentations[i % len(augmentations)]
            aug_img = img_fn(img, rng)
            aug_lines = lbl_fn(orig_lines)
            stem = f"{img_path.stem}_aug{i}"
            cv2.imwrite(str(dst_img_dir / (stem + img_path.suffix)), aug_img)
            (dst_lbl_dir / (stem + ".txt")).write_text("\n".join(aug_lines))
            added += 1
    return added


def _copy_class_split(src_cls_dir: Path, dst_cls_dir: Path, split: str) -> None:
    for kind in ("images", "labels"):
        src = src_cls_dir / kind / split
        dst = dst_cls_dir / kind / split
        dst.mkdir(parents=True, exist_ok=True)
        for f in src.glob("*.*"):
            shutil.copy2(f, dst / f.name)


def prepare_balanced_dataset(human_cap: int = HUMAN_INSTANCE_CAP,
                              plant_multiplier: int = PLANT_AUG_MULTIPLIER,
                              seed: int = 42) -> Path:
    """
    Builds dataset/balanced/ with:
      - all animal images copied as-is
      - plant images copied + augmented (train split only)
      - human images sampled so total instances <= human_cap (train) / human_cap//5 (val)
    Writes and returns the path to dataset/combined_balanced.yaml.
    """
    balanced = DATASET_ROOT / "balanced"
    rng = random.Random(seed)
    print(f"\nPreparing balanced dataset → {balanced}")

    # wipe previous run so stale files don't accumulate
    if balanced.exists():
        shutil.rmtree(balanced)

    # ── Animals: copy unchanged ────────────────────────────────────────────────
    for split in ("train", "val"):
        _copy_class_split(DATASET_ROOT / "animals", balanced / "animals", split)
    print("  animals  : copied")

    # ── Plants: copy + augment train ──────────────────────────────────────────
    for split in ("train", "val"):
        _copy_class_split(DATASET_ROOT / "plants", balanced / "plants", split)
    added = _augment_plants(
        DATASET_ROOT / "plants" / "images" / "train",
        DATASET_ROOT / "plants" / "labels" / "train",
        balanced / "plants" / "images" / "train",
        balanced / "plants" / "labels" / "train",
        plant_multiplier, rng,
    )
    orig_count = len(list((DATASET_ROOT / "plants" / "images" / "train").glob("*.*")))
    print(f"  plants   : {orig_count} original + {added} augmented = {orig_count + added} train images")

    # ── Humans: cap instances ─────────────────────────────────────────────────
    for split in ("train", "val"):
        cap = human_cap if split == "train" else human_cap // 5
        img_dir = DATASET_ROOT / "humans" / "images" / split
        lbl_dir = DATASET_ROOT / "humans" / "labels" / split
        dst_img = balanced / "humans" / "images" / split
        dst_lbl = balanced / "humans" / "labels" / split
        dst_img.mkdir(parents=True, exist_ok=True)
        dst_lbl.mkdir(parents=True, exist_ok=True)

        candidates = list(img_dir.glob("*.*"))
        rng.shuffle(candidates)

        kept, total = 0, 0
        for img_path in candidates:
            lbl_path = lbl_dir / (img_path.stem + ".txt")
            n = _count_class_instances(lbl_path, HUMAN_CLASS_ID)
            if total + n > cap:
                continue
            total += n
            shutil.copy2(img_path, dst_img / img_path.name)
            if lbl_path.exists():
                shutil.copy2(lbl_path, dst_lbl / lbl_path.name)
            kept += 1
        print(f"  humans   : [{split}] {kept} images → {total} instances (cap {cap})")

    # ── Write YAML ─────────────────────────────────────────────────────────────
    BALANCED_YAML.write_text(
        f"path: {DATASET_ROOT.as_posix()}\n\n"
        "train:\n"
        "  - balanced/plants/images/train\n"
        "  - balanced/animals/images/train\n"
        "  - balanced/humans/images/train\n\n"
        "val:\n"
        "  - balanced/plants/images/val\n"
        "  - balanced/animals/images/val\n"
        "  - balanced/humans/images/val\n\n"
        "nc: 3\n"
        "names:\n"
        "  - plant\n"
        "  - animal\n"
        "  - human\n"
    )
    print(f"  YAML     : {BALANCED_YAML}\n")
    return BALANCED_YAML


# ── Training configuration ─────────────────────────────────────────────────────
# Tuned for: 3-class outdoor detection (plant/animal/human), nano model,
# real-time inference on mobile, varying lighting & object scales.
TRAIN_CFG = dict(
    data        = str(DATA_YAML),
    epochs      = 50,
    patience    = 15,           # generous early-stop window; classes are visually distinct

    # ── Input ──────────────────────────────────────────────────────────────────
    imgsz       = 640,          # standard YOLO inference resolution
    batch       = 16,           # fits comfortably on most single-GPU setups
    rect        = False,        # square batches; required for mosaic augmentation

    # ── Hardware ───────────────────────────────────────────────────────────────
    device      = 0,
    workers     = 4,            # Windows spawns workers (no fork), so keep this low to avoid pickle MemoryError
    amp         = True,         # mixed precision — faster training, same accuracy
    cache       = False,        # RAM cache breaks Windows multiprocessing (pickle of dataset fails at spawn)

    # ── Transfer learning ──────────────────────────────────────────────────────
    pretrained  = True,
    freeze      = 10,           # freeze backbone (first 10 layers); only retrain head
                                # prevents overwriting general features with small dataset

    # ── Optimiser ──────────────────────────────────────────────────────────────
    optimizer       = "SGD",    # SGD outperforms Adam on small fine-tune datasets
    lr0             = 0.005,    # lower initial LR for fine-tuning (default 0.01 overshoots)
    lrf             = 0.005,    # final LR as a fraction of lr0
    momentum        = 0.937,
    weight_decay    = 0.0005,
    cos_lr          = True,     # cosine annealing; smoother convergence than step decay

    # Warmup: stabilise gradients during the frozen-backbone phase
    warmup_epochs   = 5,
    warmup_momentum = 0.8,
    warmup_bias_lr  = 0.05,

    # ── Loss weights ───────────────────────────────────────────────────────────
    # Plants/animals can be small; bump box loss to sharpen localisation.
    box = 8.0,                  # default 7.5 → slightly higher for tighter bboxes
    cls = 0.6,                  # slight increase: 3 distinct classes benefit from cleaner cls signal
    dfl = 1.5,

    # ── Augmentation ───────────────────────────────────────────────────────────
    # Outdoor scene: unpredictable lighting, varied distances, cluttered backgrounds.
    close_mosaic = 20,          # disable mosaic last 20 epochs so model learns clean images

    hsv_h        = 0.02,        # subtle hue shift (plant/animal colours can vary)
    hsv_s        = 0.75,        # saturation variation for sun/shade differences
    hsv_v        = 0.45,        # brightness variation (dawn/dusk/overcast)

    degrees      = 10.0,        # gentle rotation (camera tilt on handheld mobile)
    translate    = 0.15,        # crop shift for off-centre subjects
    scale        = 0.6,         # large scale range: subjects at 1 m and 20 m look very different
    shear        = 2.0,         # mild shear for perspective variation
    perspective  = 0.0002,      # subtle perspective warp (outdoor handheld camera)

    fliplr       = 0.5,         # horizontal flip (no semantic meaning for these classes)
    flipud       = 0.0,         # vertical flip not useful for upright subjects

    mosaic       = 1.0,         # always-on mosaic: critical for multi-class small-object detection
    mixup        = 0.05,        # light mixup for background generalisation
    copy_paste   = 0.15,        # raised from 0.05 — paste extra plant/animal instances into scenes

    auto_augment = "randaugment",
    erasing      = 0.3,         # random erasing: simulates partial occlusion by foliage

    # ── Validation & output ────────────────────────────────────────────────────
    val          = True,
    split        = "val",
    plots        = True,
    save_period  = 10,          # save checkpoint every 10 epochs

    # ── Run naming ─────────────────────────────────────────────────────────────
    project      = str(ROOT.parent / "runs" / "detect"),
    name         = "parkguard_detection",
    exist_ok     = False,

    # ── Reproducibility ────────────────────────────────────────────────────────
    seed         = 42,
    deterministic = True,
    verbose      = True,
)


def parse_args():
    parser = argparse.ArgumentParser(description="Train ParkGuard detection model")
    parser.add_argument("--prepare",   action="store_true", help="Rebuild balanced dataset before training")
    parser.add_argument("--resume",    action="store_true", help="Resume from last checkpoint")
    parser.add_argument("--epochs",    type=int, help="Override epoch count")
    parser.add_argument("--batch",     type=int, help="Override batch size")
    parser.add_argument("--device",    default=None, help="Override device (e.g. cpu, 0, 0,1)")
    parser.add_argument("--no-freeze", action="store_true", help="Disable layer freezing (full fine-tune)")
    return parser.parse_args()


def main():
    args = parse_args()
    cfg  = TRAIN_CFG.copy()

    # ── Dataset selection ──────────────────────────────────────────────────────
    if args.prepare:
        data_yaml = prepare_balanced_dataset()
    elif BALANCED_YAML.exists():
        print(f"Using existing balanced dataset ({BALANCED_YAML.name}). Pass --prepare to rebuild.")
        data_yaml = BALANCED_YAML
    else:
        print("No balanced dataset found. Using raw combined.yaml. Run with --prepare to balance.")
        data_yaml = DATA_YAML
    cfg["data"] = str(data_yaml)

    if args.epochs:
        cfg["epochs"] = args.epochs
    if args.batch:
        cfg["batch"] = args.batch
    if args.device is not None:
        cfg["device"] = args.device
    if args.no_freeze:
        cfg["freeze"] = 0

    if args.resume:
        # Find the most recent run's last checkpoint
        runs_root = Path(cfg["project"]) / cfg["name"]
        last_ckpt = runs_root / "weights" / "last.pt"
        if not last_ckpt.exists():
            raise FileNotFoundError(f"No checkpoint found at {last_ckpt}")
        print(f"Resuming from {last_ckpt}")
        model = YOLO(str(last_ckpt))
        cfg["resume"] = True
    else:
        if not BASE_MODEL.exists():
            raise FileNotFoundError(
                f"Base model not found: {BASE_MODEL}\n"
                "Download yolo26n.pt and place it in ai/models/"
            )
        print(f"Starting fresh training from {BASE_MODEL}")
        model = YOLO(str(BASE_MODEL))

    print("\n=== ParkGuard — Training Configuration ===")
    for k, v in cfg.items():
        print(f"  {k:<20} {v}")
    print("==========================================\n")

    results = model.train(**cfg)

    print("\n=== Training complete ===")
    best = Path(results.save_dir) / "weights" / "best.pt"
    print(f"Best weights : {best}")
    print(f"Results dir  : {results.save_dir}")
    print("\nNext step: copy best.pt to ai/models/object_detection_model.pt to deploy.")


if __name__ == "__main__":
    main()
