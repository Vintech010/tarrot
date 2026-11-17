# ตู้ไพ่พ่อหมอ · Arcana

เว็บสุ่มไพ่ Rider–Waite–Smith หนึ่งใบ พร้อมไพ่กลับหัว คำอ่านตามคำถาม ใบเสร็จพิมพ์ได้ และแกลเลอรี 78 ใบ

เว็บอ่านภาพจาก `assets/cards/` เท่านั้น หลังติดตั้งภาพแล้ว เปิด `index.html` ใน Chrome หรือ Edge เพื่อใช้งานออฟไลน์ได้

## เปิดบน Windows

1. แตก ZIP โปรเจกต์ให้ครบทุกไฟล์
2. ดับเบิลคลิก `INSTALL-ART.cmd` สคริปต์ใช้ Python 3.9 ขึ้นไป เมื่อดาวน์โหลดและตรวจภาพครบ จะใส่ภาพใน `assets/cards/` และสร้าง `arcana-github-complete.zip` ที่รวมเว็บกับภาพทั้ง 78 ใบไว้พร้อมอัปโหลด
3. เปิด `index.html`

ถ้าดาวน์โหลดด้วยสคริปต์ไม่ได้ หรือเครื่องไม่มี Python ให้ดาวน์โหลด [ชุดภาพต้นฉบับ 78 ใบ](https://cdn.tarostarot.com/downloads/tarot-card-images-1909-v1.zip) ในเบราว์เซอร์ แตก ZIP แล้วนำไฟล์ `.webp` ทั้งหมดไปไว้ใน `assets/cards/` โดยตรง ตัวอย่างเส้นทางคือ `assets/cards/Cups02.webp` และ `assets/cards/00-TheFool.webp`

## ขึ้น GitHub Pages

1. สร้าง repo บน GitHub แล้วอัปโหลด **ไฟล์ทั้งหมดที่อยู่ใน ZIP หลังแตกไฟล์** ไปไว้ที่รากของ branch `main` ให้ `index.html` อยู่ระดับบนสุด และให้อัปโหลดโฟลเดอร์ `.github` มาด้วย
2. ไปที่ **Settings → Pages → Build and deployment → Source** แล้วเลือก **GitHub Actions**
3. ไปที่ **Actions → Publish Arcana → Run workflow** แล้วเลือก `main` เมื่อเสร็จ ลิงก์เว็บจะปรากฏในผล Deploy และหน้า Settings → Pages

ถ้าใน repo มีภาพครบ 78 ใบแล้ว workflow จะใช้ภาพเหล่านั้น ถ้ายังขาด workflow จะดาวน์โหลดชุดต้นฉบับและตรวจให้ครบก่อนเผยแพร่ ภาพจะถูกเก็บเป็นไฟล์ในเว็บไซต์ที่เผยแพร่ ผู้ชมเปิดภาพจากโดเมน GitHub Pages ของเว็บโดยตรง

[วิธีตั้งค่าแหล่งเผยแพร่ GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## ตรวจชุดภาพ

```sh
python scripts/install-art.py --check
```

หากดาวน์โหลด ZIP ภาพไว้แล้ว ให้ส่งเส้นทางไฟล์เข้าสคริปต์

```sh
python scripts/install-art.py --archive path/to/tarot-card-images-1909-v1.zip
```

## เครดิตภาพ

ภาพวาดไพ่ดั้งเดิมโดย Pamela Colman Smith จากสำรับ Rider–Waite–Smith ปี 1909 ใช้ภาพสแกนสาธารณสมบัติที่รวบรวมโดย [Taro’s Tarot](https://tarostarot.com/tarot-card-data#public-domain-card-images) และมีแหล่งสำรองสำหรับการติดตั้งที่ [TaroSchenker/tarot-card-data](https://github.com/TaroSchenker/tarot-card-data)
