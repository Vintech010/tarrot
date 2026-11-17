
const byId = (id) => document.getElementById(id);
const machine = byId('machine');
const draw = byId('draw');
const deckChoice = byId('deck-choice');
const reversedChoice = byId('allow-reversed');
const topicChoice = byId('topic-choice');
const intentChoice = byId('intent-choice');
const questionInput = byId('personal-question');
const drawControls = [draw, deckChoice, reversedChoice, topicChoice, intentChoice, questionInput];
const faceDown = byId('face-down');
const face = byId('card-face');
const image = byId('card-image');
const cardArtStatus = byId('card-art-status');
const cardArtButton = byId('open-card-art');
const artDialog = byId('art-dialog');
const galleryPanel = byId('gallery-panel');
const gallerySuit = byId('gallery-suit');
const artPreview = byId('art-preview');
const previewImage = byId('art-preview-image');
const paper = byId('paper-feed');
const receipt = byId('receipt');
const printButton = byId('print');

const suitElements = { wands: 'ไฟ', cups: 'น้ำ', swords: 'ลม', pentacles: 'ดิน' };
const majorAssociations = [
  ['ลม'], ['ลม', 'ดาวพุธ'], ['น้ำ', 'ดวงจันทร์'], ['ดิน', 'ดาวศุกร์'],
  ['ไฟ', 'ราศีเมษ'], ['ดิน', 'ราศีพฤษภ'], ['ลม', 'ราศีเมถุน'], ['น้ำ', 'ราศีกรกฎ'],
  ['ไฟ', 'ราศีสิงห์'], ['ดิน', 'ราศีกันย์'], ['ไฟ', 'ดาวพฤหัสบดี'], ['ลม', 'ราศีตุล'],
  ['น้ำ'], ['น้ำ', 'ราศีพิจิก'], ['ไฟ', 'ราศีธนู'], ['ดิน', 'ราศีมังกร'],
  ['ไฟ', 'ดาวอังคาร'], ['ลม', 'ราศีกุมภ์'], ['น้ำ', 'ราศีมีน'], ['ไฟ', 'ดวงอาทิตย์'],
  ['ไฟ'], ['ดิน', 'ดาวเสาร์'],
];
const suitSigns = {
  wands: ['ราศีเมษ', 'ราศีสิงห์', 'ราศีธนู'],
  cups: ['ราศีกรกฎ', 'ราศีพิจิก', 'ราศีมีน'],
  swords: ['ราศีตุล', 'ราศีกุมภ์', 'ราศีเมถุน'],
  pentacles: ['ราศีมังกร', 'ราศีพฤษภ', 'ราศีกันย์'],
};

const pause = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let drawing = false;
let drawnCard;
let galleryRendered = false;
let galleryReturnFocus;

function randomIndex(length) {
  const range = 0x100000000;
  const limit = range - (range % length);
  const sample = new Uint32Array(1);
  do {
    crypto.getRandomValues(sample);
  } while (sample[0] >= limit);
  return sample[0] % length;
}

function pickCard(group, includeReversed) {
  const pool = group === 'all'
    ? deck
    : deck.filter((card) => group === 'major' ? card.group === 'major' : card.group !== 'major');
  return { card: pool[randomIndex(pool.length)], reversed: includeReversed && randomIndex(2) === 1 };
}

function associations(card) {
  if (card.group === 'major') return majorAssociations[card.number];
  const sign = suitSigns[card.group][Math.floor((card.number - 2) / 3)];
  return [suitElements[card.group], sign];
}

function loadCardArt(target, card, setArtState) {
  setArtState('loading');
  target.onload = () => setArtState('loaded');
  target.onerror = () => setArtState('error');
  target.src = artUrls[card.id];
}

const artMessages = { loading: 'กำลังเปิดภาพไพ่…', loaded: '', error: 'เปิดไฟล์ภาพไพ่ไม่ได้ ดูวิธีติดตั้งภาพใน README.md' };

function showCard(card, reversed) {
  drawnCard = { card, reversed };
  faceDown.hidden = true;
  image.alt = 'ไพ่ ' + card.thai + ' ' + (reversed ? 'กลับหัว' : 'ตั้งตรง');
  image.dataset.reversed = String(reversed);
  face.hidden = false;
  cardArtButton.hidden = false;
  loadCardArt(image, card, (state) => {
    image.hidden = state !== 'loaded';
    cardArtStatus.hidden = state === 'loaded';
    cardArtStatus.textContent = artMessages[state];
  });
}

function showArtworkPreview(card, reversed, fromGallery) {
  galleryPanel.hidden = true;
  artPreview.hidden = false;
  byId('gallery-back').hidden = !fromGallery;
  byId('art-preview-title').textContent = card.thai + ' · ' + card.name;
  byId('art-preview-position').textContent = reversed ? 'กลับหัว' : 'ตั้งตรง';
  byId('art-preview-source').href = 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(card.file.replaceAll(' ', '_'));
  previewImage.alt = 'ไพ่ ' + card.thai + ' ' + (reversed ? 'กลับหัว' : 'ตั้งตรง');
  previewImage.dataset.reversed = String(reversed);
  const status = byId('art-preview-status');
  loadCardArt(previewImage, card, (state) => {
    previewImage.hidden = state !== 'loaded';
    status.textContent = artMessages[state];
    status.hidden = state === 'loaded';
  });
  if (!artDialog.open) artDialog.showModal();
  artDialog.scrollTop = 0;
  artPreview.querySelector('button:not([hidden]), a').focus({ preventScroll: true });
}

function renderGallery() {
  const tiles = document.createDocumentFragment();
  const suit = gallerySuit.value;
  for (const card of deck.filter((entry) => suit === 'all' || entry.group === suit)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'art-tile';

    const thumb = document.createElement('img');
    thumb.alt = '';
    thumb.loading = 'lazy';
    thumb.decoding = 'async';
    thumb.width = 300;
    thumb.height = 527;

    const title = document.createElement('span');
    title.textContent = card.thai;
    button.append(thumb, title);
    loadCardArt(thumb, card, (state) => { thumb.dataset.state = state; });
    button.addEventListener('click', () => {
      galleryReturnFocus = button;
      showArtworkPreview(card, false, true);
    });
    tiles.append(button);
  }
  byId('art-grid').replaceChildren(tiles);
  galleryRendered = true;
}

function showGallery() {
  artPreview.hidden = true;
  galleryPanel.hidden = false;
  if (!galleryRendered) renderGallery();
  if (!artDialog.open) artDialog.showModal();
}

function currentSetup() {
  return getReadingSetup(topicChoice.value, intentChoice.value, questionInput.value);
}

function updateQuestionPreview() {
  const { topic, intent, example, question } = currentSetup();
  byId('question-mark').textContent = topic.mark;
  byId('question-route').textContent = 'แนวใบเสร็จ · ' + topic.label + ' · ' + intent.label;
  byId('question-example').textContent = question
    ? 'เลือกหัวข้อหรือรูปแบบเองได้ ถ้าระบบจับคำถามไม่ตรงใจ'
    : 'ตัวอย่างคำถาม · ' + example;
  questionInput.placeholder = example;
}

function printReading(card, reversed, setup) {
  const [element, astro] = associations(card);
  const { topic, intent, question, example } = setup;
  const context = getReadingContext(card, reversed, setup);
  receipt.style.setProperty('--receipt-ink', topic.color);
  byId('receipt-mark').textContent = topic.mark;
  byId('receipt-topic').textContent = 'ใบเสร็จ · ' + topic.label;
  byId('receipt-intent').textContent = intent.label;
  byId('receipt-question-label').textContent = question ? 'คำถามของคุณ' : 'คำถามจากหัวข้อ';
  byId('receipt-question-text').textContent = question || example;
  byId('receipt-title').textContent = card.name;
  byId('receipt-thai').textContent = card.thai;
  byId('receipt-orientation').textContent = reversed ? 'กลับหัว ↓' : 'ตั้งตรง ↑';
  byId('receipt-group').textContent = groups[card.group].name;
  byId('receipt-element').textContent = element;
  byId('receipt-astro').textContent = astro ?? '';
  byId('astro-row').hidden = !astro;
  byId('receipt-meaning').textContent = reversed ? card.reversed : card.upright;
  byId('receipt-keywords').textContent = card.keywords.replaceAll('|', ' · ');
  byId('receipt-context-title').textContent = intent.heading;
  byId('receipt-focus').textContent = context.focus;
  byId('receipt-prompt').textContent = context.prompt;
}

function setState(state, message) {
  machine.dataset.state = state;
  byId('machine-status').textContent = message;
}

async function runDraw() {
  if (drawing) return;
  drawing = true;
  const setup = currentSetup();
  const { card, reversed } = pickCard(deckChoice.value, reversedChoice.checked);
  for (const control of drawControls) control.disabled = true;
  paper.hidden = true;
  printButton.disabled = true;
  paper.classList.remove('is-printing');
  face.hidden = true;
  faceDown.hidden = false;
  cardArtButton.hidden = true;
  setState('shuffling', 'กำลังสับไพ่');
  byId('draw-label').textContent = 'กำลังสุ่ม';
  byId('announcement').textContent = 'ตู้กำลังสับไพ่';
  await pause(reducedMotion.matches ? 0 : 920);

  showCard(card, reversed);
  printReading(card, reversed, setup);
  setState('printing', 'กำลังพิมพ์');
  paper.classList.add('is-printing');
  paper.hidden = false;
  await pause(reducedMotion.matches ? 0 : 760);

  paper.classList.remove('is-printing');
  setState('printed', 'พิมพ์แล้ว');
  byId('draw-label').textContent = 'สุ่มใหม่';
  byId('machine-help').textContent = 'ตั้งจิตอีกครั้งเมื่อต้องการสุ่มรอบใหม่';
  for (const control of drawControls) control.disabled = false;
  printButton.disabled = false;
  drawing = false;
  byId('announcement').textContent = 'พิมพ์ใบเสร็จแล้ว ได้ไพ่ ' + card.thai + (reversed ? ' กลับหัว' : ' ตั้งตรง');
  receipt.focus({ preventScroll: true });
  receipt.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'nearest' });
}

draw.addEventListener('click', runDraw);
printButton.addEventListener('click', () => window.print());
topicChoice.addEventListener('change', updateQuestionPreview);
intentChoice.addEventListener('change', updateQuestionPreview);
questionInput.addEventListener('input', updateQuestionPreview);
byId('open-gallery').addEventListener('click', () => {
  galleryReturnFocus = undefined;
  showGallery();
  gallerySuit.focus();
});
gallerySuit.addEventListener('change', renderGallery);
byId('gallery-back').addEventListener('click', () => {
  showGallery();
  galleryReturnFocus?.focus();
});
cardArtButton.addEventListener('click', () => showArtworkPreview(drawnCard.card, drawnCard.reversed, false));
updateQuestionPreview();

