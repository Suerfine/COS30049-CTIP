import time
import math

class ComplianceEvaluator:
    """
    Evaluates spatial and temporal compliance rules (plucking, touching, striking)
    based on parsed YOLO pose and object detection data.
    """
    
    # --- Configuration Constants ---
    # Keypoint indices (COCO format)
    EYE_INDICES = (1, 2)
    WRIST_INDICES = (9, 10)
    ANKLE_INDICES = (15, 16) # New for kicking detection
    WRIST_TO_ELBOW = {9: 7, 10: 8}
    CONF_THRESHOLD = 0.35

    # Hand/Foot Box Geometry
    HAND_BOX_MIN_HALF_SIZE = 6
    HAND_BOX_FALLBACK_HALF_SIZE = 16
    HAND_BOX_EYE_RATIO = 0.85
    HAND_BOX_FORWARD_RATIO = 1.25
    HAND_BOX_BACK_RATIO = 0.35
    HAND_BOX_THICKNESS_RATIO = 0.65
    HAND_BOX_MIN_THICKNESS = 8
    HAND_BOX_OUTWARD_SHIFT_RATIO = 0.35
    HAND_BOX_OUTWARD_MIN_SHIFT = 4.0    # <-- Add this missing line
    HAND_BOX_OUTWARD_MAX_SHIFT = 30.0   # <-- Add this missing line
    FOOT_BOX_HALF_SIZE = 15 # Static size for ankles

    # Rest Pose filtering (arms straight down)
    HIDE_DOWNWARD_MIN_Y = 0.72
    HIDE_DOWNWARD_MAX_ABS_X = 0.45
    HIDE_DOWNWARD_MIN_DY = 6.0

    # Temporal Rules (Plucking/Touching)
    PLUCK_TOUCH_HOLD_SEC = 3.0
    ANIMAL_TOUCH_HOLD_SEC = 2.0 # 2 seconds of continuous touch
    PLUCK_TOUCH_HISTORY_FRAMES = 24
    PLUCK_BASELINE_FRAMES = 8
    PLUCK_UPWARD_MIN_PX = 14.0
    EVENT_COOLDOWN_SEC = 1.0

    # Kinematic Rules (Striking/Kicking)
    STRIKE_VELOCITY_MIN_PX = 30.0 # Minimum pixel displacement per frame to be considered a strike
    STRIKE_DISPLAY_SEC = 1.5

    def __init__(self):
        # State: Plant Plucking
        self.plant_touch_start = None
        self.touch_y_history = []
        self.pluck_event_count = 0
        self.last_pluck_time = 0.0
        self.pluck_active_until = 0.0

        # State: Animal Touching
        self.animal_touch_start = None
        self.extended_animal_touch = False

        # State: Animal Striking
        self.prev_extremities = [] # Stores (x, y) of wrists and ankles from the previous frame
        self.strike_event_count = 0
        self.last_strike_time = 0.0
        self.strike_active_until = 0.0

    def evaluate_frame(self, parsed_poses: list, parsed_detections: list, image_w: int, image_h: int) -> dict:
        """
        Main entry point per frame. 
        """
        now = time.perf_counter()

        # 1. Isolate objects by class
        plant_boxes = [d["bbox"] for d in parsed_detections if d.get("class", -1) == 0 or d.get("class_name", "").lower() in ["plant", "tree"]]
        animal_boxes = [d["bbox"] for d in parsed_detections if d.get("class", -1) == 1 or d.get("class_name", "").lower() in ["animal", "orangutan"]]

        # 2. Synthesize extremity boxes from poses
        hand_boxes = self._extract_hand_boxes(parsed_poses, image_w, image_h)
        foot_boxes = self._extract_foot_boxes(parsed_poses, image_w, image_h)
        current_extremities = self._extract_extremity_points(parsed_poses) # Just x,y points for velocity tracking

        # 3. Find Spatial Overlaps
        plant_overlaps, plant_hand_centers = self._find_overlaps(hand_boxes, plant_boxes)
        animal_hand_overlaps, _ = self._find_overlaps(hand_boxes, animal_boxes)
        animal_foot_overlaps, _ = self._find_overlaps(foot_boxes, animal_boxes)

        # 4. Evaluate Plant Plucking (Temporal)
        plucking_active = self._detect_plucking_motion(plant_hand_centers, len(plant_overlaps), now)

        # 5. Evaluate Animal Extended Touch (Temporal)
        self._detect_animal_touch(len(animal_hand_overlaps), now)

        # 6. Evaluate Animal Striking/Kicking (Kinematic)
        strike_active = self._detect_striking(current_extremities, animal_boxes, now)

        # Save current extremities for next frame's velocity calculation
        self.prev_extremities = current_extremities

        return {
            "hand_boxes": hand_boxes,
            "foot_boxes": foot_boxes,
            "hand_plant_overlaps": len(plant_overlaps),
            "plucking_active": plucking_active,
            "pluck_event_count": self.pluck_event_count,
            "animal_extended_touch": self.extended_animal_touch,
            "animal_strike_active": strike_active,
            "strike_event_count": self.strike_event_count
        }

    # -------------------------------------------------------------------------
    # Rule Evaluation Logic
    # -------------------------------------------------------------------------

    def _detect_animal_touch(self, overlap_count: int, now: float):
        """Checks if a hand has been overlapping an animal box for longer than threshold."""
        if overlap_count <= 0:
            self.animal_touch_start = None
            self.extended_animal_touch = False
            return

        if self.animal_touch_start is None:
            self.animal_touch_start = now
        
        touch_duration = now - self.animal_touch_start
        self.extended_animal_touch = touch_duration >= self.ANIMAL_TOUCH_HOLD_SEC


    def _detect_striking(self, current_extremities: list, animal_boxes: list, now: float) -> bool:
        """Calculates velocity of extremities. If high velocity intersects animal, flags strike."""
        strike_detected = False
        
        # If we have no history, we can't calculate velocity yet
        if not self.prev_extremities:
            return now < self.strike_active_until

        for ex_x, ex_y in current_extremities:
            # Check if this extremity is currently inside any animal box
            in_animal_box = any((bx1 < ex_x < bx2 and by1 < ex_y < by2) for (bx1, by1, bx2, by2) in animal_boxes)
            
            if in_animal_box:
                # Find the closest extremity from the previous frame to calculate displacement
                closest_dist = float('inf')
                for px, py in self.prev_extremities:
                    dist = math.hypot(ex_x - px, ex_y - py)
                    if dist < closest_dist:
                        closest_dist = dist
                
                # If the shortest distance to a previous extremity is very large, it means it moved fast
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
        # ... (Keep the exact same logic from the previous snippet here) ...
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
        if touch_duration < self.PLUCK_TOUCH_HOLD_SEC:
            return now < self.pluck_active_until

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

    # -------------------------------------------------------------------------
    # Internal Geometry Logic
    # -------------------------------------------------------------------------

    def _extract_extremity_points(self, poses: list) -> list:
        """Returns a flat list of (x,y) tuples for all visible wrists and ankles."""
        points = []
        for pose in poses:
            for idx in self.WRIST_INDICES + self.ANKLE_INDICES:
                if len(pose) > idx and pose[idx]["confidence"] >= self.CONF_THRESHOLD:
                    points.append((pose[idx]["x"], pose[idx]["y"]))
        return points

    def _extract_foot_boxes(self, poses: list, w: int, h: int) -> list:
        """Creates simple bounding boxes around the ankles for kick detection."""
        foot_boxes = []
        for pose in poses:
            for ankle_idx in self.ANKLE_INDICES:
                if len(pose) > ankle_idx and pose[ankle_idx]["confidence"] >= self.CONF_THRESHOLD:
                    cx, cy = pose[ankle_idx]["x"], pose[ankle_idx]["y"]
                    s = self.FOOT_BOX_HALF_SIZE
                    
                    x1, y1 = max(0, cx - s), max(0, cy - s)
                    x2, y2 = min(w - 1, cx + s), min(h - 1, cy + s)
                    
                    if x2 > x1 and y2 > y1:
                        foot_boxes.append([x1, y1, x2, y2])
        return foot_boxes

    def _extract_hand_boxes(self, poses: list, w: int, h: int) -> list:
        # ... (Keep the exact same logic from the previous snippet here) ...
        hand_boxes = []
        for pose in poses:
            if not pose or len(pose) < 11:
                continue

            half_size = self.HAND_BOX_FALLBACK_HALF_SIZE
            l_eye, r_eye = pose[self.EYE_INDICES[0]], pose[self.EYE_INDICES[1]]
            
            if l_eye["confidence"] >= self.CONF_THRESHOLD and r_eye["confidence"] >= self.CONF_THRESHOLD:
                eye_dist = math.hypot(l_eye["x"] - r_eye["x"], l_eye["y"] - r_eye["y"])
                if eye_dist > 1e-3:
                    half_size = int(max(self.HAND_BOX_MIN_HALF_SIZE, eye_dist * self.HAND_BOX_EYE_RATIO))

            half_thickness = max(self.HAND_BOX_MIN_THICKNESS, int(half_size * self.HAND_BOX_THICKNESS_RATIO))
            forward_length = max(half_size + 2, int(half_size * self.HAND_BOX_FORWARD_RATIO))
            back_length = max(2, int(half_size * self.HAND_BOX_BACK_RATIO))

            for wrist_idx in self.WRIST_INDICES:
                wrist = pose[wrist_idx]
                if wrist["confidence"] < self.CONF_THRESHOLD:
                    continue

                elbow_idx = self.WRIST_TO_ELBOW.get(wrist_idx)
                elbow = pose[elbow_idx]
                
                if elbow["confidence"] >= self.CONF_THRESHOLD:
                    dx = wrist["x"] - elbow["x"]
                    dy = wrist["y"] - elbow["y"]
                    length = math.hypot(dx, dy)
                    
                    if length > 1e-6:
                        dir_x, dir_y = dx / length, dy / length
                        if (dir_y >= self.HIDE_DOWNWARD_MIN_Y and 
                            abs(dir_x) <= self.HIDE_DOWNWARD_MAX_ABS_X and 
                            dy >= self.HIDE_DOWNWARD_MIN_DY):
                            continue 

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

                        if x2 > x1 and y2 > y1:
                            hand_boxes.append([x1, y1, x2, y2])

        return hand_boxes

    def _find_overlaps(self, primary_boxes: list, secondary_boxes: list):
        overlaps = []
        primary_centers = []
        
        for p_box in primary_boxes:
            px1, py1, px2, py2 = p_box
            for s_box in secondary_boxes:
                sx1, sy1, sx2, sy2 = s_box
                # AABB Collision check
                if px1 < sx2 and px2 > sx1 and py1 < sy2 and py2 > sy1:
                    overlaps.append((p_box, s_box))
                    primary_centers.append(((px1 + px2) * 0.5, (py1 + py2) * 0.5))
                    break # Count primary box once per frame
                    
        return overlaps, primary_centers