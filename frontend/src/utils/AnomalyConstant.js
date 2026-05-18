export const DEFAULT_MAP_CENTER = [1.5533, 110.3592];

export const LEAFLET_CSS = `
.leaflet-container {
  background: #dbe7ef;
  font-family: inherit;
  overflow: hidden;
  position: relative;
  touch-action: pan-x pan-y;
}
.leaflet-pane,
.leaflet-tile,
.leaflet-marker-icon,
.leaflet-marker-shadow,
.leaflet-tile-container,
.leaflet-pane > svg,
.leaflet-pane > canvas,
.leaflet-zoom-box,
.leaflet-image-layer,
.leaflet-layer {
  left: 0;
  position: absolute;
  top: 0;
}
.leaflet-pane > svg {
  pointer-events: none;
}
.leaflet-container img {
  max-width: none !important;
  max-height: none !important;
}
.leaflet-tile {
  filter: inherit;
  user-select: none;
  visibility: hidden;
}
.leaflet-tile-loaded {
  visibility: inherit;
}
.leaflet-map-pane canvas,
.leaflet-map-pane svg {
  z-index: 200;
}
.leaflet-tile-pane {
  z-index: 200;
}
.leaflet-overlay-pane {
  z-index: 400;
}
.leaflet-shadow-pane {
  z-index: 500;
}
.leaflet-marker-pane {
  z-index: 600;
}
.leaflet-tooltip-pane {
  z-index: 650;
}
.leaflet-popup-pane {
  z-index: 700;
}
.leaflet-control {
  position: relative;
  z-index: 800;
  pointer-events: visiblePainted;
  pointer-events: auto;
}
.leaflet-top,
.leaflet-bottom {
  pointer-events: none;
  position: absolute;
  z-index: 1000;
}
.leaflet-top {
  top: 0;
}
.leaflet-right {
  right: 0;
}
.leaflet-bottom {
  bottom: 0;
}
.leaflet-left {
  left: 0;
}
.leaflet-control {
  clear: both;
  float: left;
}
.leaflet-right .leaflet-control {
  float: right;
}
.leaflet-top .leaflet-control {
  margin-top: 10px;
}
.leaflet-bottom .leaflet-control {
  margin-bottom: 10px;
}
.leaflet-left .leaflet-control {
  margin-left: 10px;
}
.leaflet-right .leaflet-control {
  margin-right: 10px;
}
.leaflet-control-zoom {
  border: 1px solid rgba(0, 0, 0, 0.18);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.14);
  overflow: hidden;
}
.leaflet-control-zoom a {
  background: #fff;
  border-bottom: 1px solid #d1d5db;
  color: #111827;
  display: block;
  font-size: 18px;
  font-weight: 700;
  height: 30px;
  line-height: 30px;
  text-align: center;
  text-decoration: none;
  width: 30px;
}
.leaflet-control-zoom a:last-child {
  border-bottom: 0;
}
.leaflet-control-attribution {
  background: rgba(255, 255, 255, 0.86);
  color: #4b5563;
  font-size: 11px;
  padding: 2px 6px;
}
.leaflet-control-attribution a {
  color: #0f766e;
}
.leaflet-popup {
  margin-bottom: 20px;
  position: absolute;
  text-align: center;
}
.leaflet-popup-content-wrapper {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.2);
  padding: 1px;
  text-align: left;
}
.leaflet-popup-content {
  line-height: 1.4;
  margin: 14px 16px;
}
.leaflet-popup-tip-container {
  height: 20px;
  left: 50%;
  margin-left: -20px;
  overflow: hidden;
  pointer-events: none;
  position: absolute;
  width: 40px;
}
.leaflet-popup-tip {
  background: #fff;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.16);
  height: 16px;
  margin: -8px auto 0;
  transform: rotate(45deg);
  width: 16px;
}
.leaflet-popup-close-button {
  color: #6b7280;
  font: 18px/24px Arial, sans-serif;
  height: 24px;
  position: absolute;
  right: 4px;
  text-align: center;
  text-decoration: none;
  top: 4px;
  width: 24px;
}
.leaflet-tooltip {
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);
  color: #111827;
  padding: 8px 10px;
  pointer-events: none;
  position: absolute;
  white-space: nowrap;
}
.leaflet-interactive {
  cursor: pointer;
  pointer-events: auto;
}
`;

export const EVENT_LABELS = {
  touching_plant: "Touching Plant",
  touching_animal: "Touching Animal",
  plucking_plants: "Plucking Plants",
  hitting_animal: "Hitting Animal",
  extended_plant_touch: "Extended Plant Touch",
  extended_animal_touch: "Extended Animal Touch",
  forest_fire: "Forest Fire",
  flooding: "Flooding",
  loud_noise: "Loud Noise",
  trespassing: "Trespassing",
  other: "Other",
};

import i18n from "../i18n";

export const getSeverityConfig = () => ({
  high: {
    color: "#dc2626",
    fillColor: "#ef4444",
    label: i18n.t('high'),
  },
  medium: {
    color: "#d97706",
    fillColor: "#f59e0b",
    label: i18n.t('medium'),
  },
  low: {
    color: "#059669",
    fillColor: "#10b981",
    label: i18n.t('low'),
  },
});