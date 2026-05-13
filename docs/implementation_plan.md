# 실행 계획서: Homefit 인터벌 타이머

이 문서는 Homefit 인터벌 타이머 프로젝트의 개발 단계, 기술 사양 및 작업 목록을 설명합니다.

## 1. 프로젝트 개요
고강도 인터벌 트레이닝(HIIT)을 위한 클라이언트 사이드 전용(DB 없음) Next.js 웹 애플리케이션입니다. 사용자 정의 루틴 생성, 오디오 피드백이 포함된 인터랙티브 인터벌 타이머, 모바일 사용자를 위한 PWA 지원이 특징입니다.

### 기술 스택
- **프레임워크**: Next.js 14+ (App Router)
- **스타일링**: Tailwind CSS
- **아이콘**: Lucide React
- **애니메이션**: Framer Motion
- **상태 관리**: React Hooks + LocalStorage
- **오디오**: Web Audio API / HTML5 Audio
- **PWA**: `manifest.json` 및 서비스 워커 설정

---

## 2. 기술 전략

### 2.1 데이터 관리
- **운동 데이터셋**: 50가지 맨몸 운동이 담긴 `public/data/exercises.json`을 생성합니다.
- **이미지/GIF 전략**: [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)을 활용하여, 로컬 프로젝트 용량을 늘리지 않고 GitHub의 Raw URL을 통해 고화질 애니메이션을 불러옵니다.
- **로컬 저장**: 사용자의 루틴과 설정은 `localStorage`의 `homefit_routine` 키 아래에 저장됩니다.

### 2.2 핵심 로직: `useTimer` 훅
인터벌 상태를 관리하는 커스텀 훅:
- **상태**: `status` (대기, 운동 중, 휴식 중, 일시정지, 완료), `currentIndex`, `timeLeft`.
- **효과**: 카운트다운을 위한 `setInterval`, 3, 2, 1초 전 오디오 비프음 트리거.

### 2.3 오디오 통합
- **알림**: 휴식 마지막 3초 동안의 "준비" 비프음(고음)과 "시작" 및 "종료" 비프음(저음).
- **배경음악(BGM)**: 운동 중 토글 가능한 저작권 프리 음악 플레이어 통합.

---

## 3. 개발 단계

### 1단계: 기반 구축 및 데이터 (완료)
- [x] Next.js 프로젝트 구조 초기화.
- [x] `public/data/exercises.json` 생성 (이미지/GIF 링크가 포함된 50개 항목).
- [x] 다크 모드를 위한 Tailwind 설정 및 Global CSS 구성.

### 2단계: 핵심 컴포넌트 및 상태 (완료)
- [x] `ExerciseSelector` 컴포넌트 구축.
- [x] 운동/휴식 시간 설정을 위한 루틴 폼 구현.
- [x] 카운트다운 로직을 위한 `useTimer` 커스텀 훅 구현.

### 3단계: 타이머 UI 및 애니메이션 (완료)
- [x] 대형 카운트다운 및 현재/다음 운동 표시가 포함된 타이머 대시보드 구축.
- [x] 운동 전환을 위한 Framer Motion 애니메이션 추가.
- [x] 진행 바 시각화 구현.

### 4단계: 오디오 및 PWA (완료)
- [x] BGM 및 비프음을 위한 오디오 컨트롤러 통합.
- [x] PWA 지원을 위한 `manifest.json` 및 아이콘 설정.
- [x] 모바일 반응형 UI/UX 최종 마무리.

---

## 4. 데이터셋 통합 참고 사항
**hasaneyldrm/exercises-dataset**과 관련하여 다음과 같이 사용합니다:
- **이미지 URL**: `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/images/[id].jpg`
- **GIF URL**: `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/[id].gif`
- 해당 리스트에서 50개의 관련 맨몸 운동을 선정하고 이름을 한글로 로컬라이징했습니다.

---

## 5. 검증 체크리스트
- [x] 핵심 4개 운동(푸쉬업, 스쿼트, 런지, 플랭크)이 정상적으로 렌더링되는지 확인.
- [x] 타이머 슬라이더가 5초 단위로 작동하는지 확인.
- [x] 운동-휴식 전환 시 BGM/비프음 오디오 트리거 확인.
- [x] 모바일 레이아웃(가로/세로) 반응형 대응 확인.
- [x] iOS/Android에서 PWA 설치 테스트.
