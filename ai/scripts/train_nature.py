"""
ParkGuard nature detection model training script.

Trains yolo26n to detect plants and animals only.
Human detection is handled exclusively by yolo26npose.

Usage:
    python ai/scripts/train_nature.py                # train on raw dataset
    python ai/scripts/train_nature.py --prepare      # rebuild balanced dataset, then train
    python ai/scripts/train_nature.py --resume       # resume from last checkpoint
    python ai/scripts/train_nature.py --epochs 150   # override epoch count
"""

import argparse
import random
import shutil
from pathlib import Path

import cv2
import numpy as np
from ultralytics import YOLO


# ── Paths ──────────────────────────────────────────────────────────────────────
ROOT          = Path(__file__).parent
MODELS_DIR    = ROOT / "models"
DATASET_ROOT  = ROOT.parent / "dataset"
DATA_YAML     = DATASET_ROOT / "combined_nature.yaml"
BALANCED_YAML = DATASET_ROOT / "combined_nature_balanced.yaml"
BASE_MODEL    = ROOT / "yolo26n.pt"

PLANT_AUG_MULTIPLIER = 2   # augmented copies generated per plant image


# ── Augmentation helpers ───────────────────────────────────────────────────────

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
    augmentations = [
        (lambda img, _: cv2.flip(img, 1),                             _flip_labels_horizontal),
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


def _copy_split(src_cls_dir: Path, dst_cls_dir: Path, split: str) -> None:
    for kind in ("images", "labels"):
        src = src_cls_dir / kind / split
        dst = dst_cls_dir / kind / split
        dst.mkdir(parents=True, exist_ok=True)
        for f in src.glob("*.*"):
            shutil.copy2(f, dst / f.name)


# ── Dataset balancing ──────────────────────────────────────────────────────────

def prepare_balanced_dataset(plant_multiplier: int = PLANT_AUG_MULTIPLIER,
                              seed: int = 42) -> Path:
    """
    Builds dataset/nature_balanced/ with:
      - all animal images copied as-is
      - plant images copied + augmented (train split only)
    Writes and returns the path to dataset/combined_nature_balanced.yaml.
    """
    balanced = DATASET_ROOT / "nature_balanced"
    rng = random.Random(seed)
    print(f"\nPreparing balanced nature dataset → {balanced}")

    if balanced.exists():
        shutil.rmtree(balanced)

    # ── Animals: copy unchanged ────────────────────────────────────────────────
    for split in ("train", "val"):
        _copy_split(DATASET_ROOT / "animals", balanced / "animals", split)
    print("  animals : copied")

    # ── Plants: copy + augment train split ────────────────────────────────────
    for split in ("train", "val"):
        _copy_split(DATASET_ROOT / "plants", balanced / "plants", split)
    added = _augment_plants(
        DATASET_ROOT / "plants" / "images" / "train",
        DATASET_ROOT / "plants" / "labels" / "train",
        balanced / "plants" / "images" / "train",
        balanced / "plants" / "labels" / "train",
        plant_multiplier, rng,
    )
    orig = len(list((DATASET_ROOT / "plants" / "images" / "train").glob("*.*")))
    print(f"  plants  : {orig} original + {added} augmented = {orig + added} train images")

    # ── Write YAML ─────────────────────────────────────────────────────────────
    BALANCED_YAML.write_text(
        f"path: {DATASET_ROOT.as_posix()}\n\n"
        "train:\n"
        "  - nature_balanced/plants/images/train\n"
        "  - nature_balanced/animals/images/train\n\n"
        "val:\n"
        "  - nature_balanced/plants/images/val\n"
        "  - nature_balanced/animals/images/val\n\n"
        "nc: 2\n"
        "names:\n"
        "  - plant\n"
        "  - animal\n"
    )
    print(f"  YAML    : {BALANCED_YAML}\n")
    return BALANCED_YAML


# ── Training configuration ─────────────────────────────────────────────────────
TRAIN_CFG = dict(
    data        = str(DATA_YAML),
    epochs      = 50,
    patience    = 15,

    # ── Input ──────────────────────────────────────────────────────────────────
    imgsz       = 640,
    batch       = 16,
    rect        = False,

    # ── Hardware ───────────────────────────────────────────────────────────────
    device      = 0,
    workers     = 4,
    amp         = True,
    cache       = False,

    # ── Transfer learning ──────────────────────────────────────────────────────
    pretrained  = True,
    freeze      = 10,

    # ── Optimiser ──────────────────────────────────────────────────────────────
    optimizer       = "SGD",
    lr0             = 0.005,
    lrf             = 0.005,
    momentum        = 0.937,
    weight_decay    = 0.0005,
    cos_lr          = True,

    warmup_epochs   = 5,
    warmup_momentum = 0.8,
    warmup_bias_lr  = 0.05,

    # ── Loss weights ───────────────────────────────────────────────────────────
    box = 8.0,
    cls = 0.5,   # only 2 classes — slightly lower cls weight than 3-class model
    dfl = 1.5,

    # ── Augmentation ───────────────────────────────────────────────────────────
    close_mosaic = 20,

    hsv_h        = 0.02,
    hsv_s        = 0.75,
    hsv_v        = 0.45,

    degrees      = 10.0,
    translate    = 0.15,
    scale        = 0.6,
    shear        = 2.0,
    perspective  = 0.0002,

    fliplr       = 0.5,
    flipud       = 0.0,

    mosaic       = 1.0,
    mixup        = 0.05,
    copy_paste   = 0.2,   # raised: plant/animal instances benefit more from copy-paste without humans

    auto_augment = "randaugment",
    erasing      = 0.3,

    # ── Validation & output ────────────────────────────────────────────────────
    val          = True,
    split        = "val",
    plots        = True,
    save_period  = 10,

    # ── Run naming ─────────────────────────────────────────────────────────────
    project      = str(ROOT.parent / "runs" / "detect"),
    name         = "parkguard_nature",
    exist_ok     = False,

    # ── Reproducibility ────────────────────────────────────────────────────────
    seed         = 42,
    deterministic = True,
    verbose      = True,
)


def parse_args():
    parser = argparse.ArgumentParser(description="Train ParkGuard nature (plant/animal) detection model")
    parser.add_argument("--prepare",   action="store_true", help="Rebuild balanced dataset before training")
    parser.add_argument("--resume",    action="store_true", help="Resume from last checkpoint")
    parser.add_argument("--epochs",    type=int,            help="Override epoch count")
    parser.add_argument("--batch",     type=int,            help="Override batch size")
    parser.add_argument("--device",    default=None,        help="Override device (e.g. cpu, 0, 0,1)")
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
        print("No balanced dataset found. Using raw combined_nature.yaml. Run with --prepare to balance.")
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
                "Download yolo26n.pt and place it in ai/scripts/"
            )
        print(f"Starting fresh training from {BASE_MODEL}")
        model = YOLO(str(BASE_MODEL))

    print("\n=== ParkGuard Nature — Training Configuration ===")
    for k, v in cfg.items():
        print(f"  {k:<20} {v}")
    print("=================================================\n")

    results = model.train(**cfg)

    print("\n=== Training complete ===")
    best = Path(results.save_dir) / "weights" / "best.pt"
    print(f"Best weights : {best}")
    print(f"Results dir  : {results.save_dir}")
    print("\nNext step: copy best.pt to ai/models/object_detection_model.pt to deploy.")


if __name__ == "__main__":
    main()
