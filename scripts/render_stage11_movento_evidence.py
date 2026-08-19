from pathlib import Path
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

OUT = Path(__file__).resolve().parents[1] / "evidence" / "stage11-movento-760h" / "STAGE_11_MOVENTO_760H_TECHNICAL.png"
OUT.parent.mkdir(parents=True, exist_ok=True)

# Canonical pilot: external 800 x 870 x 580, panel 18, back 18, toe-kick 150.
external_w, external_h, external_d = 800, 870, 580
internal_w, internal_h, internal_d = 764, 684, 562
skw, nl, skl = 722, 500, 490
front_h, gap, drawer_count = (internal_h - 2 - 2 - 2 * 2) / 3, 2, 3
box_h = front_h - 40

fig, axes = plt.subplots(1, 2, figsize=(16, 9), dpi=160)
fig.patch.set_facecolor("#f4f6f8")
for ax in axes:
    ax.set_facecolor("#f4f6f8")
    ax.axis("off")

ax = axes[0]
ax.set_xlim(-70, 870)
ax.set_ylim(-130, 910)
ax.add_patch(Rectangle((0, 0), external_w, external_h, fill=False, linewidth=2.2, edgecolor="#24364b"))
ax.add_patch(Rectangle((18, 150), internal_w, internal_h, facecolor="#d2a070", edgecolor="#24364b", linewidth=1.6))
for i in range(drawer_count):
    y = 150 + 2 + i * (front_h + gap)
    ax.add_patch(Rectangle((18, y), internal_w, front_h, facecolor="#c69160", edgecolor="#5e4632", linewidth=1.1))
    ax.text(400, y + front_h / 2, f"DRAWER FRONT {i+1}\n764 × {front_h:.1f} mm", ha="center", va="center", fontsize=10, color="#2b2118")
ax.add_patch(Rectangle((0, 0), external_w, 150, facecolor="#cbd5e1", edgecolor="#24364b", linewidth=1.2))
ax.annotate("carcass opening\nLW 764 mm × internal H 684 mm", xy=(18, 820), xytext=(-60, 850), arrowprops=dict(arrowstyle="->", color="#376d97"), fontsize=9, color="#376d97")
ax.annotate("2 mm reveals + 2 mm inter-front gaps", xy=(810, 470), xytext=(825, 540), arrowprops=dict(arrowstyle="->", color="#376d97"), fontsize=9, color="#376d97")
ax.set_title("STAGE 11 — MOVENTO PILOT\nFront elevation / declarative stack", fontsize=14, weight="bold", color="#17283b")
ax.text(400, -82, "Stage 10 front equation preserved; Stage 11 changes only industrial slide application.", ha="center", fontsize=9, color="#536273")

ax = axes[1]
ax.set_xlim(-80, 650)
ax.set_ylim(-160, 690)
ax.add_patch(Rectangle((0, 0), internal_d, 560, fill=False, edgecolor="#24364b", linewidth=2.0))
ax.add_patch(Rectangle((0, 65), skl, box_h, facecolor="#efdcbf", edgecolor="#8b6846", linewidth=1.5))
ax.add_patch(Rectangle((0, 65), 15, box_h, facecolor="#c69560", edgecolor="#8b6846", linewidth=1.0))
ax.add_patch(Rectangle((skl - 15, 65), 15, box_h, facecolor="#c69560", edgecolor="#8b6846", linewidth=1.0))
ax.add_patch(Rectangle((15, 65 + box_h - 15), skl - 30, 15, facecolor="#c69560", edgecolor="#8b6846", linewidth=1.0))
ax.add_patch(Rectangle((15, 65), skl - 30, 15, facecolor="#c69560", edgecolor="#8b6846", linewidth=1.0))
ax.plot([0, 0], [65, 65 + box_h], color="#2c8ab3", linewidth=5)
ax.plot([skl, skl], [65, 65 + box_h], color="#2c8ab3", linewidth=5)
ax.annotate("MOVENTO 760H\nNL 500 mm", xy=(skl / 2, 30), xytext=(260, -78), arrowprops=dict(arrowstyle="->", color="#2c8ab3"), fontsize=11, color="#1d6d8c", weight="bold")
ax.annotate("SKL = NL − 10 = 490 mm", xy=(skl / 2, 65 + box_h + 5), xytext=(140, 595), arrowprops=dict(arrowstyle="->", color="#376d97"), fontsize=10, color="#376d97")
ax.annotate("SKW = LW − 42 = 722 mm\nside panel 15 mm ≤ max 16 mm", xy=(skl - 10, 300), xytext=(350, 345), arrowprops=dict(arrowstyle="->", color="#376d97"), fontsize=10, color="#376d97")
ax.text(10, 520, "Mounting: READY\nCNC coordinates: INCOMPLETE", fontsize=11, color="#9a4d28", weight="bold")
ax.text(10, 470, "Blum template T65.1000.02\nScrews 609.1500 / 661.1450.HG", fontsize=9, color="#536273")
ax.set_title("Side section / manufacturer equations", fontsize=14, weight="bold", color="#17283b")

fig.text(0.5, 0.02, "Deterministic technical evidence — not a Planner screenshot and not a manufacturer drawing.", ha="center", fontsize=9, color="#536273")
fig.tight_layout(rect=[0, 0.05, 1, 1])
fig.savefig(OUT, bbox_inches="tight")
print(OUT)
