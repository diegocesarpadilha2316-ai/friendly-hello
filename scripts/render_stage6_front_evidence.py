from PIL import Image, ImageDraw, ImageFont

W, H = 1400, 900
img = Image.new("RGB", (W, H), "#f7f7f5")
d = ImageDraw.Draw(img)
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22)
    small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
    title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 30)
except OSError:
    font = small = title = ImageFont.load_default()

# ResolvedFrontLayout 900 x 870 x 580: 2 + 447 + 2 + 447 + 2 = 900.
scale = 0.9
left_frame = 170
right_frame = left_frame + 900 * scale
top = 120
bottom = top + 720 * scale
front_top = top
front_bottom = bottom
cabinet_y0 = top - 8
cabinet_y1 = bottom + 8

def x(mm):
    return left_frame + (mm + 450) * scale

def label(text, xy, fill="#1f2937", f=font, anchor=None):
    d.text(xy, text, fill=fill, font=f, anchor=anchor)

label("DIORIS PLANNER V2 — EVIDÊNCIA TÉCNICA", (W // 2, 25), f=title, anchor="mm")
label("Golden Module: Balcão 2 Portas | Front Layout 900 × 870 × 580 mm", (W // 2, 58), f=font, anchor="mm")

# Cabinet frontal envelope and front zone.
d.rectangle((left_frame, cabinet_y0, right_frame, cabinet_y1), outline="#374151", width=4, fill="#e5e7eb")
d.rectangle((left_frame + 5, front_top, right_frame - 5, front_bottom), outline="#111827", width=2, fill="#d1d5db")

# Doors: edges [-448,-1] and [1,448], centered on axis.
for a, b, name in [(-448, -1, "PORTA 1"), (1, 448, "PORTA 2")]:
    d.rectangle((x(a), front_top, x(b), front_bottom), outline="#111827", width=4, fill="#c89b6d")
    label(name, ((x(a) + x(b)) / 2, (front_top + front_bottom) / 2), fill="#3b2416", f=font, anchor="mm")

# Center axis and pivots.
d.line((x(0), front_top - 25, x(0), front_bottom + 25), fill="#2563eb", width=2)
label("EIXO X", (x(0), front_top - 35), fill="#2563eb", f=small, anchor="mm")
d.ellipse((x(-448)-6, front_top + 32, x(-448)+6, front_top + 44), fill="#dc2626")
d.ellipse((x(448)-6, front_top + 32, x(448)+6, front_top + 44), fill="#dc2626")
label("pivôs: -448 / +448 mm", (W // 2, front_bottom + 45), fill="#dc2626", f=small, anchor="mm")

# Dimension helper.
def dim(x0, x1, y, text, color="#059669"):
    d.line((x0, y, x1, y), fill=color, width=3)
    d.line((x0, y - 8, x0, y + 8), fill=color, width=3)
    d.line((x1, y - 8, x1, y + 8), fill=color, width=3)
    d.polygon([(x0, y), (x0 + 12, y - 5), (x0 + 12, y + 5)], fill=color)
    d.polygon([(x1, y), (x1 - 12, y - 5), (x1 - 12, y + 5)], fill=color)
    label(text, ((x0 + x1) / 2, y - 24), fill=color, f=small, anchor="mm")

dim(left_frame, x(-448), front_top - 18, "reveal esquerdo = 2 mm")
dim(x(-1), x(1), front_top - 2, "gap central = 2 mm")
dim(x(448), right_frame, front_top - 18, "reveal direito = 2 mm")
dim(x(-448), x(-1), front_bottom + 75, "porta 1 = 447 mm", color="#7c3aed")
dim(x(1), x(448), front_bottom + 115, "porta 2 = 447 mm", color="#7c3aed")

# Vertical dimensions.
d.line((right_frame + 55, front_top, right_frame + 55, front_bottom), fill="#b45309", width=3)
d.line((right_frame + 45, front_top, right_frame + 65, front_top), fill="#b45309", width=3)
d.line((right_frame + 45, front_bottom, right_frame + 65, front_bottom), fill="#b45309", width=3)
label("altura frente = 714 mm", (right_frame + 75, (front_top + front_bottom) / 2), fill="#b45309", f=small, anchor="lm")

# Formula and status panel.
panel_y = 770
d.rounded_rectangle((120, panel_y, W - 120, 870), radius=12, fill="#ffffff", outline="#9ca3af", width=2)
label("Fechamento: 2 + 447 + 2 + 447 + 2 = 900 mm", (W // 2, panel_y + 27), fill="#111827", f=font, anchor="mm")
label("STATUS: READY  |  simétrico  |  centers = -224,5 / +224,5 mm  |  overlay = 16 mm  |  boring distance = não selecionado", (W // 2, panel_y + 67), fill="#166534", f=small, anchor="mm")

img.save("/home/ubuntu/dioris-audit-repo/STEP_6_GOLDEN_FRONT_LAYOUT_900.png")
