from pathlib import Path
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

OUT = Path('/home/ubuntu/dioris-audit-repo/STEP_7_GOLDEN_CARCASS_900.png')
W, H, D = 900, 870, 580
TOE, PANEL, BACK = 150, 18, 6
INNER_W, BODY_H, INNER_H = W - 2 * PANEL, H - TOE, H - TOE - 2 * PANEL
fig, ax = plt.subplots(figsize=(15, 9), dpi=160)
ax.set_facecolor('#f5f2ec')
fig.patch.set_facecolor('#f5f2ec')

# Front elevation: carcass envelope and structural panels.
scale_x = 1.0
x0 = -W / 2
ax.add_patch(Rectangle((x0, TOE), W, BODY_H, fill=False, linewidth=2.2, edgecolor='#3b3b3b', linestyle='--'))
ax.add_patch(Rectangle((-W/2, TOE), PANEL, BODY_H, facecolor='#d9c3a5', edgecolor='#4b3828', linewidth=1.5))
ax.add_patch(Rectangle((W/2-PANEL, TOE), PANEL, BODY_H, facecolor='#d9c3a5', edgecolor='#4b3828', linewidth=1.5))
ax.add_patch(Rectangle((-INNER_W/2, TOE), INNER_W, PANEL, facecolor='#c7a77c', edgecolor='#4b3828', linewidth=1.5))
ax.add_patch(Rectangle((-INNER_W/2, H-PANEL), INNER_W, PANEL, facecolor='#c7a77c', edgecolor='#4b3828', linewidth=1.5))
ax.add_patch(Rectangle((-INNER_W/2+1, 510-3), INNER_W-2, 6, facecolor='#b8b6b0', edgecolor='#555555', linewidth=1.0, alpha=0.75))
ax.add_patch(Rectangle((-INNER_W/2+1, 510-9), INNER_W-2, PANEL, facecolor='#b99769', edgecolor='#4b3828', linewidth=1.2, alpha=0.9))
ax.add_patch(Rectangle((-W/2, 0), W, TOE, facecolor='#55565b', edgecolor='#2f3033', linewidth=1.4, alpha=0.9))

# Dimension helpers.
def dim(x1, y1, x2, y2, text, offset=12, color='#2b4c73'):
    if abs(y2-y1) < 1:
        ax.annotate('', xy=(x2, y2+offset), xytext=(x1, y1+offset), arrowprops=dict(arrowstyle='<->', color=color, lw=1.2))
        ax.text((x1+x2)/2, y1+offset+5, text, ha='center', va='bottom', fontsize=9, color=color, fontweight='bold')
    else:
        ax.annotate('', xy=(x2+offset, y2), xytext=(x1+offset, y1), arrowprops=dict(arrowstyle='<->', color=color, lw=1.2))
        ax.text(x1+offset+5, (y1+y2)/2, text, ha='left', va='center', fontsize=9, color=color, fontweight='bold', rotation=90)

dim(-W/2, 0, W/2, 0, '900 mm externo', -44)
dim(W/2, 0, W/2, H, '870 mm externo', 55)
dim(-W/2, 0, -W/2, TOE, '150 mm rodapé', -70, '#6b4f2a')
dim(-INNER_W/2, TOE, INNER_W/2, TOE, '864 mm vão interno', -18, '#6b4f2a')
dim(-INNER_W/2, 510-9, INNER_W/2, 510-9, '862 mm prateleira', 18, '#6b4f2a')

ax.annotate('side-left\n18 × 720 × 580', (-W/2+PANEL/2, 510), xytext=(-610, 620), arrowprops=dict(arrowstyle='->', color='#4b3828'), fontsize=9, ha='center')
ax.annotate('side-right\n18 × 720 × 580', (W/2-PANEL/2, 510), xytext=(610, 620), arrowprops=dict(arrowstyle='->', color='#4b3828'), fontsize=9, ha='center')
ax.annotate('base\n864 × 18 × 580\nBETWEEN sides', (0, TOE+PANEL/2), xytext=(-230, 55), arrowprops=dict(arrowstyle='->', color='#4b3828'), fontsize=9, ha='center')
ax.annotate('top panel\n864 × 18 × 580', (0, H-PANEL/2), xytext=(250, 820), arrowprops=dict(arrowstyle='->', color='#4b3828'), fontsize=9, ha='center')
ax.annotate('back\n864 × 684 × 6\nrecessed rear', (0, 510), xytext=(250, 395), arrowprops=dict(arrowstyle='->', color='#555555'), fontsize=9, ha='center')
ax.annotate('shelf-1\n862 × 18 × 560\nsupported', (0, 510), xytext=(250, 535), arrowprops=dict(arrowstyle='->', color='#4b3828'), fontsize=9, ha='center')
ax.text(0, 930, 'DIORIS PLANNER V2 — GOLDEN CARCASS 900 × 870 × 580 mm', ha='center', fontsize=15, fontweight='bold', color='#202020')
ax.text(0, 900, 'ResolvedCarcass / MODULE-LOCAL front elevation — technical evidence, not browser screenshot', ha='center', fontsize=9, color='#555555')
ax.set_xlim(-720, 720)
ax.set_ylim(-100, 980)
ax.set_aspect('equal', adjustable='box')
ax.axis('off')
fig.tight_layout()
fig.savefig(OUT, bbox_inches='tight')
print(OUT)
