# Android Auto Clicker 최종 정리

최종 업데이트: 2026-08-02
배포 버전: `v2026.08.02`

## 1. 프로젝트 개요

Android 전용 자동 클릭 앱이다. React Native 화면에서 클릭 간격과 권한을 설정하고, Android Accessibility Service와 `dispatchGesture()`를 사용해 다른 앱 위에서 실제 터치를 반복한다.

현재 주요 기술:

- Expo SDK 54.0.36
- React Native 0.81.5
- React 19.1
- Expo Router 및 TypeScript
- Kotlin Android 네이티브 모듈
- Android Accessibility Service
- `WindowManager` 오버레이
- AsyncStorage

iOS는 지원하지 않는다. 웹 화면은 발표용 시뮬레이션이며 실제 Android 터치를 수행하지 않는다.

## 2. 현재 구현 기능

### 실제 Android 자동 클릭

- Accessibility Service 기반 실제 터치
- `dispatchGesture()`를 통한 반복 탭
- 다른 앱 위에서 백그라운드 자동 클릭
- 클릭 간격: 100~5000ms
- 조절 단위: 100ms
- 클릭 횟수와 실행 상태 동기화

### 플로팅 타깃과 컨트롤

- 다른 앱 위에 표시되는 클릭 타깃
- 타깃 중심점을 실제 클릭 좌표로 사용
- 정지 상태에서 타깃 직접 드래그
- 실행 중에는 `MOVE` 핸들로 위치 이동
- 이동 중 자동 클릭 일시 정지
- 위치 저장 및 앱 재실행 시 복원
- 화면 크기와 방향 변경 시 위치 보정

### 실행 상태 표시

- 정지 상태: `정지`, 빨간색
- 실행 상태: `작동중`, 초록색
- `작동중`일 때만 밝은 테두리와 발광 효과 표시
- 발광점이 약 1.6초마다 버튼 외곽선을 순환
- 앱 화면, 웹 데모, 네이티브 플로팅 버튼에 동일한 상태 표현 적용

### 사용자 터치 보호

- 플로팅 컨트롤 밖의 사용자 터치를 감지
- 사용자 터치 감지 후 자동 클릭을 200ms 동안 보류
- 자동 클릭이 생성한 제스처는 사용자 입력 감지에서 제외

## 3. 필수 Android 권한

다음 두 권한을 사용자가 Android 설정에서 직접 허용해야 한다.

1. 접근성 서비스
2. 다른 앱 위에 표시

최초 실행 시 안내 창의 `권한 설정 시작`을 누르면 접근성 설정으로 이동한다. 접근성 서비스를 활성화하고 앱으로 돌아오면 오버레이 권한 설정으로 이어진다.

Android 또는 제조사 배터리 정책이 접근성 서비스를 중지할 수 있다. 자동 클릭이 동작하지 않으면 접근성 서비스와 배터리 최적화 상태를 다시 확인한다.

## 4. APK 설치

### GitHub에서 설치

GitHub 저장소의 `releases/auto-clicker-v2026.08.02.apk`를 내려받는다. Android에서 출처를 알 수 없는 앱 설치를 허용한 뒤 APK를 실행한다.

기존 앱과 서명이 다르면 업데이트 설치가 실패할 수 있다. 이 경우 기존 테스트 앱을 삭제한 뒤 다시 설치하면 기존 앱 데이터와 권한 설정도 함께 제거된다.

### ADB로 설치

```powershell
adb install -r auto-clicker-v2026.08.02.apk
```

패키지 이름:

```text
com.cro383.autoclicker
```

최소 지원 버전은 Android 7(API 24)이며 target/compile SDK는 36이다.

## 5. 현재 APK 정보

- Release 파일명: `auto-clicker-v2026.08.02.apk`
- 저장소 경로: `releases/auto-clicker-v2026.08.02.apk`
- 로컬 빌드 파일: `android/app/build/outputs/apk/release/app-release.apk`
- 파일 크기: 82,584,448 bytes
- SHA-256: `A6DE7DEC47AD76CE996AB13C94138053FF35703CDD6D43ABA600D801026BC9F7`
- JavaScript 번들 포함: 예
- Metro 개발 서버 없이 독립 실행: 예
- 서명: 개발용 debug keystore

이 APK는 다른 Android 휴대폰에서 기능을 확인하기 위한 테스트 배포본이다. Google Play 정식 배포 전에는 별도의 안전한 release keystore와 배포 파이프라인이 필요하다.

## 6. 다른 휴대폰 테스트 체크리스트

다음 순서로 확인한다.

1. APK 설치와 앱 실행
2. 접근성 서비스 활성화
3. 다른 앱 위에 표시 권한 허용
4. 플로팅 타깃 표시
5. 타깃 드래그와 위치 저장
6. 100ms, 1000ms, 5000ms 간격 조절
7. 다른 앱에서 실제 자동 클릭
8. `정지`와 `작동중` 상태 전환
9. `작동중` 버튼의 회전 발광점
10. 실행 중 `MOVE` 핸들로 타깃 이동
11. 화면 회전 또는 해상도 변경 후 위치 보정
12. 앱과 휴대폰 재시작 후 권한 및 위치 상태
13. 장시간 실행 시 발열과 배터리 사용량

테스트 결과에는 제조사, 모델명, Android 버전, 실패 단계와 화면 캡처를 함께 기록하는 것이 좋다.

## 7. 개발 및 검증 명령

```powershell
npm install
npm.cmd run lint
npx.cmd tsc --noEmit
```

Debug APK 빌드:

```powershell
cd android
.\gradlew.bat :app:assembleDebug
```

독립 실행 release APK 빌드:

```powershell
cd android
$env:NODE_ENV='production'
.\gradlew.bat :app:assembleRelease
```

출력 경로:

```text
android/app/build/outputs/apk/release/app-release.apk
```

## 8. 주요 파일

### React Native

- `app/(tabs)/index.tsx`: 메인 화면
- `components/auto-click-panel.tsx`: 상태, 횟수, 간격 및 컨트롤
- `components/orbiting-border-glow.tsx`: 작동 중 회전 발광점
- `components/permission-panel.tsx`: 권한 확인과 설정 안내
- `components/draggable-target.tsx`: 앱 내부 타깃 이동
- `components/web-demo-auto-clicker.tsx`: 웹 시연 화면
- `hooks/use-auto-click-engine.ts`: 실행 상태 연결
- `lib/auto-clicker-native.ts`: Kotlin 모듈 인터페이스
- `lib/target-position-storage.ts`: 타깃 위치 저장

### Android 네이티브

- `AutoClickerAccessibilityService.kt`: 실제 클릭, 오버레이, 컨트롤과 발광 애니메이션
- `AutoClickerModule.kt`: React Native에서 호출하는 네이티브 API
- `AutoClickerPackage.kt`: 네이티브 모듈 등록
- `MainApplication.kt`: React Native 패키지 연결
- `AndroidManifest.xml`: 접근성 서비스와 오버레이 권한 선언
- `auto_clicker_accessibility_service.xml`: 접근성 서비스 설정

## 9. 검증된 환경

- 기기: Samsung Galaxy S23 (`SM-S916N`)
- Android 패키지: `com.cro383.autoclicker`
- Expo lint: 통과
- TypeScript 검사: 통과
- Kotlin release 컴파일: 통과
- Release APK 빌드: 통과
- Metro 없는 독립 실행: 통과
- 치명적 Android/React Native 오류: 없음

## 10. 알려진 제한과 위험

- 접근성 및 오버레이 권한은 자동 승인할 수 없다.
- Android 또는 제조사 정책이 접근성 서비스를 중지할 수 있다.
- 일부 보안 화면과 앱 정책은 자동 터치를 제한할 수 있다.
- 200ms 사용자 터치 보류는 일반적인 충돌을 줄이지만 긴 스크롤 전체를 보호하지는 않는다.
- 빠른 클릭 간격은 배터리 사용량과 발열을 증가시킬 수 있다.
- 현재 APK는 개발용 키로 서명되어 정식 스토어 배포용이 아니다.
- Google Play 배포 전 Accessibility API 정책과 사용자 고지를 별도로 검토해야 한다.
