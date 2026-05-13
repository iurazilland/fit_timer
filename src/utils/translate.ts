const TRANSLATION_MAP: { [key: string]: string } = {
  // Body Parts & Categories
  "abs": "복근", "waist": "허리", "back": "등", "cardio": "유산소", "chest": "가슴",
  "lower arms": "하완", "lower legs": "종아리", "neck": "목", "shoulders": "어깨",
  "upper arms": "상완", "upper legs": "허벅지", "thigh": "허벅지", "calf": "종아리",
  "triceps": "삼두", "biceps": "이두", "quads": "대퇴사두", "hamstrings": "햄스트링",
  "glutes": "둔근", "forearms": "전완근", "lats": "광배근", "traps": "승모근", "obliques": "외복사근",

  // Equipment
  "body weight": "맨몸", "bodyweight": "맨몸", "dumbbell": "덤벨", "barbell": "바벨",
  "kettlebell": "케틀벨", "cable": "케이블", "band": "밴드", "bench": "벤치",
  "floor": "바닥", "wall": "벽", "stability ball": "짐볼", "medicine ball": "메디신볼",
  "bosu": "보수", "box": "박스", "rope": "로프", "towel": "타월", "roller": "롤러",

  // Keywords & Names
  "push up": "푸쉬업", "push-up": "푸쉬업", "pushup": "푸쉬업", "press up": "푸쉬업",
  "sit up": "싯업", "sit-up": "싯업", "situp": "싯업", "pull up": "풀업", "pull-up": "풀업",
  "chin up": "친업", "chin-up": "친업", "squat": "스쿼트", "lunge": "런지", "plank": "플랭크",
  "crunch": "크런치", "deadlift": "데드리프트", "burpee": "버피", "bridge": "브릿지",
  "dip": "딥스", "shrug": "슈러그", "reach": "리치", "touch": "터치", "toucher": "터치",
  "jumping jack": "팔 벌려 뛰기", "mountain climber": "마운틴 클라이머", "air bike": "에어 바이크",
  "rotation": "회전", "twist": "트위스트", "fly": "플라이", "press": "프레스",
  "bend": "밴드", "circle": "서클", "stretch": "스트레칭", "stretching": "스트레칭",
  "kick": "킥", "swing": "스윙", "jump": "점프", "step": "스텝", "hop": "홉",
  "walk": "워크", "run": "런", "climb": "클라임", "bicycle": "바이시클", "bike": "바이크",
  "air": "에어", "side": "사이드", "front": "프론트", "reverse": "리버스",
  "incline": "인클라인", "decline": "디클라인", "lateral": "레터럴", "archer": "아처",
  "alternating": "교차", "alternate": "교차", "wide": "와이드", "narrow": "내로우"
};

/**
 * 영문 운동 명칭이나 부위를 한글로 번역합니다.
 */
export function translate(text: string): string {
  if (!text) return "";
  
  let result = text.toLowerCase().trim();
  
  // 1. 긴 문구(복합어)부터 우선 치환하여 의미 왜곡 방지
  const sortedKeys = Object.keys(TRANSLATION_MAP).sort((a, b) => b.length - a.length);
  for (const en of sortedKeys) {
      const ko = TRANSLATION_MAP[en];
      // 단어 경계를 인식하여 정확하게 치환
      const regex = new RegExp(`\\b${en}\\b`, 'gi');
      result = result.replace(regex, ko);
  }

  // 2. 사전에 없는 영단어가 남아있을 경우 단어별로 다시 한번 확인
  if (/[a-z]/.test(result)) {
      result = result.split(/[\s-]+/).map(word => TRANSLATION_MAP[word] || word).join(" ");
  }

  // 3. 기호 및 숫자 케이스 정리
  result = result.replace(/3\/4/g, "3/4").replace(/45°/g, "45도").replace(/°/g, "도");

  return result.charAt(0).toUpperCase() + result.slice(1).replace(/\s+/g, ' ').trim();
}

/**
 * 운동 방법(지시문)을 자연스러운 한글로 번역합니다.
 */
export function translateInstructions(text: string): string {
  if (!text) return "상세 설명이 없습니다.";

  const INSTRUCTION_PATTERNS: { [key: string]: string } = {
    "lie flat on your back with your knees bent and feet flat on the ground": "무릎을 굽히고 발을 바닥에 붙인 상태로 등을 대고 똑바로 눕습니다.",
    "place your hands behind your head with your elbows pointing outwards": "팔꿈치가 바깥을 향하게 하여 손을 머리 뒤에 둡니다.",
    "engaging your abs, slowly lift your upper body off the ground": "복근에 힘을 주며 상체를 지면에서 천천히 들어 올립니다.",
    "curling forward until your torso is at a 45-degree angle": "몸통이 45도 각도가 될 때까지 앞으로 몸을 말아 올립니다.",
    "pause for a moment at the top": "정점에서 잠시 멈춥니다.",
    "slowly lower your upper body back down to the starting position": "상체를 다시 시작 자세로 천천히 내립니다.",
    "repeat for the desired number of repetitions": "원하는 횟수만큼 반복합니다.",
    "stand with your feet shoulder-width apart": "발을 어깨 너비로 벌리고 섭니다.",
    "keep your back straight and your core engaged": "등을 곧게 펴고 코어에 힘을 유지합니다.",
    "slowly bend your torso to one side": "몸통을 한쪽 옆으로 천천히 구부립니다.",
    "lowering your hand towards your knee": "손을 무릎 쪽으로 내립니다.",
    "slowly return to the starting position": "천천히 시작 자세로 돌아옵니다.",
    "repeat on the other side": "반대쪽도 반복합니다.",
    "continue alternating sides": "양쪽을 교차하며 계속합니다.",
  };

  let translated = text.toLowerCase();

  // 긴 문장 패턴 우선 치환
  const sortedPatterns = Object.entries(INSTRUCTION_PATTERNS).sort((a, b) => b[0].length - a[0].length);
  for (const [en, ko] of sortedPatterns) {
    const regex = new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    translated = translated.replace(regex, ko + " ");
  }

  // 잔여 영어 청소
  const cleanup = ["with your", "and", "then", "the", "your", "a", "an", "to", "is", "at", "on", "in", "of", "from", "by", "for"];
  cleanup.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    translated = translated.replace(regex, "");
  });

  return translated.replace(/\s+/g, ' ').replace(/\. \./g, '.').trim();
}
