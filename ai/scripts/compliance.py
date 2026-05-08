import time
import math

class ComplianceEvaluator:
    EYE_INDICES = (1, 2)
    WRIST_INDICES = (9, 10)
    ANKLE_INDICES = (15, 16)
    WRIST_TO_ELBOW = {9: 7, 10: 8}
    CONF_THRESHOLD = 0.35

    HAND_BOX_MIN_HALF_SIZE = 6
    HAND_BOX_FALLBACK_HALF_SIZE = 16
    HAND_BOX_EYE_RATIO = 0.85
    HAND_BOX_ARM_RATIO = 0.45
    HAND_BOX_FORWARD_RATIO = 1.25
    HAND_BOX_BACK_RATIO = 0.35
    HAND_BOX_THICKNESS_RATIO = 0.65
    HAND_BOX_MIN_THICKNESS = 8
    HAND_BOX_OUTWARD_SHIFT_RATIO = 0.35
    HAND_BOX_OUTWARD_MIN_SHIFT = 4.0
    HAND_BOX_OUTWARD_MAX_SHIFT = 30.0
    FOOT_BOX_HALF_SIZE = 15

    HIDE_DOWNWARD_MIN_Y = 0.72
    HIDE_DOWNWARD_MAX_ABS_X = 0.45
    HIDE_DOWNWARD_MIN_DY = 6.0

    PLUCK_TOUCH_HOLD_SEC = 3.0
    ANIMAL_TOUCH_HOLD_SEC = 2.0
    EXTENDED_TOUCH_SEC = 5.0
    PLUCK_TOUCH_HISTORY_FRAMES = 24
    PLUCK_BASELINE_FRAMES = 8
    PLUCK_UPWARD_MIN_PX = 14.0
    EVENT_COOLDOWN_SEC = 1.0

    STRIKE_VELOCITY_MIN_PX = 30.0
    STRIKE_DISPLAY_SEC = 1.5

    def __init__(self):
        self.plant_touch_start = None
        self.touch_y_history = []
        self.pluck_event_count = 0
        self.last_pluck_time = 0.0
        self.pluck_active_until = 0.0

        self.prev_extremities = []
        self.strike_event_count = 0
        self.last_strike_time = 0.0
        self.strike_active_until = 0.0

        self.plant_touch_start = None
        self.animal_touch_start = None
        
        self.is_touching_plant = False
        self.is_touching_animal = False
        self.extended_plant_touch_active = False
        self.extended_animal_touch_active = False

    def evaluate_frame(self, parsed_poses: list, parsed_detections: list, image_w: int, image_h: int) -> dict:
        now = time.perf_counter()

        def _is_plant(name: str) -> bool:
            ln = (name or "").lower()
            return "plant" in ln or "tree" in ln or "leaf" in ln

        def _is_animal(name: str) -> bool:
            ln = (name or "").lower()
            return "animal" in ln or "orangutan" in ln or "monkey" in ln

        plant_boxes = [list(map(int, d["bbox"])) for d in parsed_detections if _is_plant(d.get("class_name", ""))]
        animal_boxes = [list(map(int, d["bbox"])) for d in parsed_detections if _is_animal(d.get("class_name", ""))]
        
        hand_boxes = self._extract_hand_boxes(parsed_poses, image_w, image_h)
        
        plant_overlaps, plant_hand_centers = self._find_overlaps(hand_boxes, plant_boxes)
        animal_overlaps, _ = self._find_overlaps(hand_boxes, animal_boxes)

        self.is_touching_plant = len(plant_overlaps) > 0
        if self.is_touching_plant:
            if self.plant_touch_start is None: self.plant_touch_start = now
            duration = now - self.plant_touch_start
            self.extended_plant_touch_active = duration >= self.EXTENDED_TOUCH_SEC
        else:
            self.plant_touch_start = None
            self.extended_plant_touch_active = False

        self.is_touching_animal = len(animal_overlaps) > 0
        if self.is_touching_animal:
            if self.animal_touch_start is None: self.animal_touch_start = now
            duration = now - self.animal_touch_start
            self.extended_animal_touch_active = duration >= self.EXTENDED_TOUCH_SEC
        else:
            self.animal_touch_start = None
            self.extended_animal_touch_active = False

        plucking_active = self._detect_plucking_motion(plant_hand_centers, len(plant_overlaps), now)
        strike_active = self._detect_striking(self._extract_extremity_points(parsed_poses), animal_boxes, now)

        return {
            "touch_plant": self.is_touching_plant,
            "touch_animal": self.is_touching_animal,
            "extended_touch_plant": self.extended_plant_touch_active,
            "extended_touch_animal": self.extended_animal_touch_active,
            "plucking_plant": plucking_active,
            "animal_strike": strike_active,
            "pluck_event_count": self.pluck_event_count,
            "strike_event_count": self.strike_event_count,
            "hand_boxes": hand_boxes,
            "plant_hand_centers": plant_hand_centers,
        }

    def _detect_animal_touch(self, overlap_count: int, now: float):
        if overlap_count <= 0:
            self.animal_touch_start = None
            self.extended_animal_touch = False
            return
        if self.animal_touch_start is None:
            self.animal_touch_start = now
        touch_duration = now - self.animal_touch_start
        self.extended_animal_touch = touch_duration >= self.ANIMAL_TOUCH_HOLD_SEC

    def _detect_striking(self, current_extremities: list, animal_boxes: list, now: float) -> bool:
        strike_detected = False
        if not self.prev_extremities: return now < self.strike_active_until

        for ex_x, ex_y in current_extremities:
            in_animal_box = any((bx1 < ex_x < bx2 and by1 < ex_y < by2) for (bx1, by1, bx2, by2) in animal_boxes)
            if in_animal_box:
                closest_dist = float('inf')
                for px, py in self.prev_extremities:
                    dist = math.hypot(ex_x - px, ex_y - py)
                    if dist < closest_dist: closest_dist = dist
                if closest_dist >= self.STRIKE_VELOCITY_MIN_PX:
                    strike_detected = True
                    break

        can_trigger = (now - self.last_strike_time) >= self.EVENT_COOLDOWN_SEC
        if strike_detected and can_trigger:
            self.strike_event_count += 1
            self.last_strike_time = now
            self.strike_active_until = now + self.STRIKE_DISPLAY_SEC

        return now < self.strike_active_until

    def _detect_plucking_motion(self, hand_centers: list, overlap_count: int, now: float) -> bool:
        if overlap_count <= 0 or not hand_centers:
            self.plant_touch_start = None
            self.touch_y_history.clear()
            return now < self.pluck_active_until

        primary_hand_y = min(cy for cx, cy in hand_centers)
        if self.plant_touch_start is None:
            self.plant_touch_start = now
            self.touch_y_history.clear()

        self.touch_y_history.append(primary_hand_y)
        if len(self.touch_y_history) > self.PLUCK_TOUCH_HISTORY_FRAMES:
            self.touch_y_history.pop(0)

        touch_duration = now - self.plant_touch_start
        if touch_duration < self.PLUCK_TOUCH_HOLD_SEC: return now < self.pluck_active_until

        baseline_window = self.touch_y_history[-self.PLUCK_BASELINE_FRAMES:]
        baseline_y = max(baseline_window) 
        upward_movement = baseline_y - primary_hand_y

        can_trigger = (now - self.last_pluck_time) >= self.EVENT_COOLDOWN_SEC
        if upward_movement >= self.PLUCK_UPWARD_MIN_PX and can_trigger:
            self.pluck_event_count += 1
            self.last_pluck_time = now
            self.pluck_active_until = now + self.EVENT_COOLDOWN_SEC
            self.plant_touch_start = now
            self.touch_y_history = [primary_hand_y]

        return now < self.pluck_active_until

    def _extract_extremity_points(self, poses: list) -> list:
        points = []
        for pose in poses:
            for idx in self.WRIST_INDICES + self.ANKLE_INDICES:
                if len(pose) > idx and pose[idx]["confidence"] >= self.CONF_THRESHOLD:
                    points.append((pose[idx]["x"], pose[idx]["y"]))
        return points

    def _extract_foot_boxes(self, poses: list, w: int, h: int) -> list:
        foot_boxes = []
        for pose in poses:
            for ankle_idx in self.ANKLE_INDICES:
                if len(pose) > ankle_idx and pose[ankle_idx]["confidence"] >= self.CONF_THRESHOLD:
                    cx, cy = pose[ankle_idx]["x"], pose[ankle_idx]["y"]
                    s = self.FOOT_BOX_HALF_SIZE
                    x1, y1 = max(0, cx - s), max(0, cy - s)
                    x2, y2 = min(w - 1, cx + s), min(h - 1, cy + s)
                    if x2 > x1 and y2 > y1: foot_boxes.append([x1, y1, x2, y2])
        return foot_boxes

    def _extract_hand_boxes(self, poses: list, w: int, h: int) -> list:
        hand_boxes = []
        for pose in poses:
            if not pose or len(pose) < 11: continue
            base_half_size = self.HAND_BOX_FALLBACK_HALF_SIZE
            l_eye, r_eye = pose[self.EYE_INDICES[0]], pose[self.EYE_INDICES[1]]
            
            if l_eye["confidence"] >= self.CONF_THRESHOLD and r_eye["confidence"] >= self.CONF_THRESHOLD:
                eye_dist = math.hypot(l_eye["x"] - r_eye["x"], l_eye["y"] - r_eye["y"])
                if eye_dist > 1e-3: base_half_size = int(max(self.HAND_BOX_MIN_HALF_SIZE, eye_dist * self.HAND_BOX_EYE_RATIO))

            for wrist_idx in self.WRIST_INDICES:
                if wrist_idx >= len(pose): continue
                wrist = pose[wrist_idx]
                if wrist["confidence"] < self.CONF_THRESHOLD: continue

                elbow_idx = self.WRIST_TO_ELBOW.get(wrist_idx)
                elbow = pose[elbow_idx] if (elbow_idx is not None and elbow_idx < len(pose)) else None
                current_half_size = base_half_size

                if elbow is not None and elbow["confidence"] >= self.CONF_THRESHOLD:
                    dx = wrist["x"] - elbow["x"]
                    dy = wrist["y"] - elbow["y"]
                    length = math.hypot(dx, dy)

                    if length > 1e-3:
                        arm_based_size = int(length * self.HAND_BOX_ARM_RATIO)
                        current_half_size = max(current_half_size, arm_based_size)

                    if length > 1e-6:
                        dir_x, dir_y = dx / length, dy / length
                        if (dir_y >= self.HIDE_DOWNWARD_MIN_Y and abs(dir_x) <= self.HIDE_DOWNWARD_MAX_ABS_X and dy >= self.HIDE_DOWNWARD_MIN_DY):
                            continue 

                        half_thickness = max(self.HAND_BOX_MIN_THICKNESS, int(current_half_size * self.HAND_BOX_THICKNESS_RATIO))
                        forward_length = max(current_half_size + 2, int(current_half_size * self.HAND_BOX_FORWARD_RATIO))
                        back_length = max(2, int(current_half_size * self.HAND_BOX_BACK_RATIO))

                        shift = min(max(length * self.HAND_BOX_OUTWARD_SHIFT_RATIO, self.HAND_BOX_OUTWARD_MIN_SHIFT), self.HAND_BOX_OUTWARD_MAX_SHIFT)
                        cx = wrist["x"] + (dir_x * shift)
                        cy = wrist["y"] + (dir_y * shift)

                        back_x, back_y = cx - (dir_x * back_length), cy - (dir_y * back_length)
                        tip_x, tip_y = cx + (dir_x * forward_length), cy + (dir_y * forward_length)

                        x1 = int(min(back_x, tip_x) - half_thickness)
                        y1 = int(min(back_y, tip_y) - half_thickness)
                        x2 = int(max(back_x, tip_x) + half_thickness)
                        y2 = int(max(back_y, tip_y) + half_thickness)

                        x1, y1 = max(0, x1), max(0, y1)
                        x2, y2 = min(w - 1, x2), min(h - 1, y2)

                        if x2 > x1 and y2 > y1: hand_boxes.append([x1, y1, x2, y2])
                else:
                    cx, cy = wrist["x"], wrist["y"]
                    s = current_half_size
                    x1 = int(max(0, cx - s))
                    y1 = int(max(0, cy - s))
                    x2 = int(min(w - 1, cx + s))
                    y2 = int(min(h - 1, cy + s))
                    if x2 > x1 and y2 > y1: hand_boxes.append([x1, y1, x2, y2])
        return hand_boxes

    def _find_overlaps(self, primary_boxes: list, secondary_boxes: list):
        overlaps = []
        primary_centers = []
        for p_box in primary_boxes:
            px1, py1, px2, py2 = p_box
            for s_box in secondary_boxes:
                sx1, sy1, sx2, sy2 = s_box
                if px1 < sx2 and px2 > sx1 and py1 < sy2 and py2 > sy1:
                    overlaps.append((p_box, s_box))
                    primary_centers.append(((px1 + px2) * 0.5, (py1 + py2) * 0.5))
                    break
        return overlaps, primary_centers