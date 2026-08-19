from pathlib import Path
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, FancyArrowPatch

out = Path(__file__).resolve().parents[1] / "evidence" / "stage10-golden-drawer" / "STAGE_10_GOLDEN_DRAWER_3_TECHNICAL.png"
out.parent.mkdir(parents=True, exist_ok=True)

W, H = 800, 870
panel = 18
toe = 150
opening_w = W - 2 * panel
opening_h = H - toe - 2 * panel
gap = 2
reveal = 2
front_h = (opening_h - 2 * reveal - 2 * gap) / 3
box_w = opening_w - 26
box_h = front_h - 40
box_d = 514

fig, (ax_front, ax_side) = plt.subplots(1, 2, figsize=(14, 8), constrained_layout=True)
fig.patch.set_facecolor("#f5f7fa")
for ax in (ax_front, ax_side):
    ax.set_facecolor("white")

# Front elevation.
ax_front.add_patch(Rectangle((-W/2, 0), W, H, fill=False, linewidth=2.4, edgecolor="#27364b"))
ax_front.add_patch(Rectangle((-W/2, 0), W, toe, facecolor="#d9dee7", edgecolor="#27364b", linewidth=1.2))
ax_front.text(0, toe/2, "CARCASS / TOE-KICK", ha="center", va="center", fontsize=9, color="#27364b")
colors = ["#d2a679", "#c99768", "#b98558"]
for i in range(3):
    bottom = toe + panel + reveal + i * (front_h + gap)
    ax_front.add_patch(Rectangle((-opening_w/2, bottom), opening_w, front_h, facecolor=colors[i], edgecolor="#6b442b", linewidth=1.4))
    ax_front.text(0, bottom + front_h/2, f"DRAWER FRONT {i+1}\n{opening_w:.0f} × {front_h:.1f} mm", ha="center", va="center", fontsize=9, color="#2c1d14")
    if i < 2:
        ax_front.annotate(f"gap {gap} mm", xy=(opening_w/2 + 10, bottom + front_h + gap/2), xytext=(opening_w/2 + 75, bottom + front_h + gap/2), fontsize=8, arrowprops=dict(arrowstyle="<->", color="#4677a8"), color="#4677a8", va="center")
ax_front.annotate(f"opening {opening_w:.0f} × {opening_h:.0f} mm", xy=(-opening_w/2, toe + panel), xytext=(-W/2 - 40, H - 70), fontsize=9, arrowprops=dict(arrowstyle="<->", color="#395b7a"), color="#395b7a")
ax_front.set_title("TECHNICAL DETERMINISTIC EVIDENCE\nFront elevation — 3 drawer fronts", fontsize=12, weight="bold")
ax_front.set_xlim(-W/2 - 130, W/2 + 130)
ax_front.set_ylim(-20, H + 30)
ax_front.set_aspect("equal")
ax_front.axis("off")

# Side section: carcass opening, one drawer box and semantic slides.
ax_side.add_patch(Rectangle((0, 0), H*0.42, H, fill=False, linewidth=2.4, edgecolor="#27364b"))
ax_side.add_patch(Rectangle((0, 0), H*0.42, toe, facecolor="#d9dee7", edgecolor="#27364b", linewidth=1.2))
box_left = 32
box_bottom = toe + panel + reveal + front_h + gap
ax_side.add_patch(Rectangle((box_left, box_bottom), box_d, box_h, facecolor="#d8b48b", edgecolor="#6b442b", linewidth=1.4))
ax_side.add_patch(Rectangle((box_left + 10, box_bottom + 10), box_d - 20, box_h - 20, facecolor="#f0ddc4", edgecolor="#9d734a", linewidth=1.0))
# Slides as semantic rails, deliberately not manufacturer-specific.
for y in (box_bottom + 18, box_bottom + box_h - 18):
    ax_side.plot([box_left + 12, box_left + box_d - 12], [y, y], color="#2f74a0", linewidth=5, solid_capstyle="round")
ax_side.text(box_left + box_d/2, box_bottom + box_h/2, f"DRAWER BOX\n{box_w:.0f} W × {box_h:.1f} H × {box_d:.0f} D mm", ha="center", va="center", fontsize=9, color="#4a2d1b")
ax_side.add_patch(FancyArrowPatch((box_left + box_d/2, box_bottom - 55), (box_left + box_d/2 + 110, box_bottom - 55), arrowstyle="->", mutation_scale=14, linewidth=1.5, color="#2f74a0"))
ax_side.text(box_left + box_d/2 + 120, box_bottom - 55, "visual-safe travel", va="center", fontsize=8, color="#2f74a0")
ax_side.text(28, H - 36, "CARCASS OPENING", fontsize=10, weight="bold", color="#27364b")
ax_side.text(28, H - 60, "DrawerStack → front + box + slide rails", fontsize=9, color="#395b7a")
ax_side.text(28, 35, "Slides: semantic placement only; manufacturing INCOMPLETE", fontsize=8, color="#9a4d2d")
ax_side.set_title("Section — drawer box + slide semantics", fontsize=12, weight="bold")
ax_side.set_xlim(-20, 500)
ax_side.set_ylim(-90, H + 30)
ax_side.set_aspect("equal")
ax_side.axis("off")

fig.savefig(out, dpi=180, bbox_inches="tight")
print(out)
