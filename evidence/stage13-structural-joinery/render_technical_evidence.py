from pathlib import Path
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, FancyArrowPatch

out = Path(__file__).with_name("STAGE_13_STRUCTURAL_JOINERY_TECHNICAL.png")
fig, ax = plt.subplots(figsize=(16, 10), dpi=180)
ax.set_xlim(-440, 440)
ax.set_ylim(-360, 420)
ax.axis("off")
fig.patch.set_facecolor("white")
ax.text(0, 390, "TECHNICAL DETERMINISTIC EVIDENCE", ha="center", va="center", fontsize=20, weight="bold", color="#123047")
ax.text(0, 360, "Não é screenshot do browser — Base Golden 800 × 870 × 580 mm", ha="center", va="center", fontsize=12, color="#4a5568")

# Carcass topological view: schematic, not a scale render.
parts = {
    "side-left": (-360, -120, 90, 500, "HOST\nside-left\n18 mm\ntarget face R"),
    "base": (-240, -210, 480, 90, "TARGET\nbase\n18 mm\nhost face T"),
    "top": (-240, 170, 480, 90, "TARGET\ntop\n18 mm\nhost face B"),
    "side-right": (270, -120, 90, 500, "HOST\nside-right\n18 mm\ntarget face L"),
}
for name, (x, y, w, h, label) in parts.items():
    ax.add_patch(Rectangle((x, y), w, h, facecolor="#e7eef5", edgecolor="#24536f", linewidth=2))
    ax.text(x+w/2, y+h/2, label, ha="center", va="center", fontsize=10, color="#17384d", weight="bold")
ax.text(0, 315, "ResolvedCarcass — host/target topology", ha="center", fontsize=13, color="#24536f", weight="bold")

# Joint points on panels; front/rear pair positions are schematic z labels.
joint_defs = [
    ("side-left-to-base", -195, -160, "host T / target R"),
    ("side-right-to-base", 195, -160, "host T / target L"),
    ("side-left-to-top", -195, 160, "host B / target R"),
    ("side-right-to-top", 195, 160, "host B / target L"),
]
for relation, x, y, faces in joint_defs:
    ax.scatter([x-18, x+18], [y, y], s=60, color="#138a4b", zorder=5)
    ax.text(x, y-38 if y < 0 else y+38, f"{relation}\noccurrence 1/2 · z=±210 mm\n{faces}", ha="center", va="center", fontsize=8, color="#17384d")
    ax.add_patch(FancyArrowPatch((x, y), (0, 0), arrowstyle="-|>", mutation_scale=8, linewidth=0.8, color="#7b8794", alpha=0.55))

# Status cards.
ax.add_patch(Rectangle((-410, -330), 390, 82, facecolor="#d9f7e8", edgecolor="#138a4b", linewidth=2))
ax.text(-215, -289, "ASSEMBLY READY\n8 resolved structural joints\nConnector: Häfele Minifix 15", ha="center", va="center", fontsize=10, color="#063b21", weight="bold")
ax.add_patch(Rectangle((20, -330), 390, 82, facecolor="#fff2cc", edgecolor="#b7791f", linewidth=2))
ax.text(215, -289, "MACHINING INCOMPLETE\n8 housing boring READY: Ø15 × 12.5 mm\n8 bolt drilling: diameter/depth/tool UNKNOWN", ha="center", va="center", fontsize=10, color="#5b3a00", weight="bold")
ax.text(0, -350, "Part-local points are carried by MachiningOperation; unknown industrial data is never replaced by zero.", ha="center", fontsize=9, color="#4a5568")

fig.savefig(out, bbox_inches="tight")
plt.close(fig)
