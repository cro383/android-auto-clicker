# Android Auto Clicker 개발 진행 요약

최종 업데이트: 2026-07-20

## 1. 프로젝트 목표

이 프로젝트는 Expo 데모가 아니라 Android의 다른 앱 위에서 실제 터치를 수행하는 자동 클릭 앱을 만드는 것이 목표다.

핵심 Android 기술은 다음과 같다.

- Android Accessibility Service
- `dispatchGesture()`
- `WindowManager` 오버레이
- Kotlin 네이티브 모듈
- React Native와 네이티브 Android 간 브리지

지원 대상은 Android이며 iOS는 현재 범위에 포함하지 않는다.

## 2. 기술 구성

- Expo SDK 54.0.36
- React Native 0.81.5
- React 19.1
- Expo Router
- TypeScript
- Kotlin
- React Native Gesture Handler
- React Native Reanimated
- AsyncStorage

## 3. 현재 완료된 기능

### 실제 자동 클릭

- Accessibility Service 등록 및 권한 확인
- `dispatchGesture()`를 이용한 실제 Android 터치
- 최소 100ms부터 최대 5000ms까지 클릭 간격 조절
- 시작, 중지 및 클릭 횟수 표시
- 실제 클릭 타이머를 네이티브 Android 서비스에서 관리
- 다른 앱 위에서도 자동 클릭 실행

### 플로팅 오버레이

- 빨간색 클릭 타깃 표시
- 타깃 위치를 실제 클릭 좌표로 사용
- 실행 전에는 빨간 타깃을 직접 드래그 가능
- 실행 중에는 클릭이 아래 앱으로 통과하도록 빨간 타깃을 터치 불가 상태로 전환
- 실행 중 위치 변경을 위한 별도 `MOVE` 버튼 제공
- `MOVE` 드래그 중 클릭을 일시 정지하고 손을 떼면 자동 재개
- `MOVE` 버튼 크기를 초기 크기의 2배로 확대
- 플로팅 `START` 및 `STOP` 컨트롤 제공

### 상태 및 위치 저장

- 빨간 타깃의 위치 저장 및 앱 재실행 후 복원
- 화면 크기나 방향이 바뀌면 타깃이 화면 밖으로 나가지 않도록 보정
- 클릭 실행 상태와 클릭 횟수를 네이티브에서 React Native로 전달
- 클릭 간격 저장

### 권한 처리

- 접근성 서비스 활성화 여부 표시
- 다른 앱 위에 표시 권한 여부 표시
- 앱에서 각 Android 설정 화면 열기
- 권한 상태가 바뀌면 앱 복귀 시 상태 갱신

### 화면 정리

- 앱 표시 이름을 `Android Auto Clicker`로 변경
- 기본 Expo 템플릿의 `Explore` 화면 제거
- 하단 `Home / Explore` 탭 제거
- 홈 화면 하나만 표시하도록 라우팅 단순화

## 4. 주요 구조

### React Native

- `app/(tabs)/index.tsx`: 메인 화면
- `components/auto-click-panel.tsx`: 클릭 상태, 간격, 시작 및 중지 UI
- `components/permission-panel.tsx`: Android 권한 상태와 설정 버튼
- `components/draggable-target.tsx`: 앱 내부 타깃 표시 및 좌표 연동
- `hooks/use-auto-click-engine.ts`: React Native 상태 관리
- `lib/auto-clicker-native.ts`: Kotlin 네이티브 모듈 호출 인터페이스

### Android 네이티브

- `AutoClickerAccessibilityService.kt`: 클릭 타이머, 실제 터치, 오버레이 및 드래그 처리
- `AutoClickerModule.kt`: React Native에서 호출하는 네이티브 API
- `AutoClickerPackage.kt`: 네이티브 모듈 등록
- `MainApplication.kt`: React Native 패키지 연결

## 5. 개발 실행 방법

### 준비

```powershell
npm install
```

실제 Android 기기에서는 개발자 옵션과 USB 디버깅을 활성화한다.

### Metro 실행

```powershell
npm.cmd start -- --dev-client
```

### USB 기기와 Metro 연결

```powershell
adb reverse tcp:8081 tcp:8081
```

### Android 디버그 빌드

```powershell
cd android
.\gradlew.bat :app:assembleDebug
```

Android Studio는 에뮬레이터나 Kotlin 디버깅이 필요할 때만 사용하며, 실제 기기 테스트 중 계속 실행할 필요는 없다.

## 6. 필수 권한 설정

앱을 설치한 뒤 다음 두 권한을 사용자가 직접 허용해야 한다.

1. `Accessibility service`의 `Open settings`를 눌러 Android Auto Clicker 서비스를 활성화한다.
2. `Display over other apps`의 `Open settings`를 눌러 다른 앱 위에 표시를 허용한다.

권한을 허용한 뒤 앱으로 돌아오면 상태가 `Granted` 또는 활성화 상태로 바뀐다.

## 7. 기본 사용 방법

1. 클릭 간격을 `-`와 `+`로 설정한다.
2. 플로팅 타깃을 표시한다.
3. 빨간 원을 원하는 클릭 지점으로 이동한다.
4. `START`를 누른다.
5. 다른 앱으로 이동해 실제 클릭을 확인한다.
6. 실행 중 위치를 변경하려면 파란색 `MOVE` 버튼을 드래그한다.
7. 종료하려면 플로팅 `STOP` 또는 앱의 `Stop`을 누른다.

## 8. 테스트용 독립 실행 APK

PC, Android Studio, USB 연결 및 Metro 없이 설치할 수 있는 테스트 APK를 생성했다.

로컬 파일:

```text
dist/Android-Auto-Clicker-Test-v1.0.0.apk
```

SHA-256:

```text
C8BDDE833F87B4E52E2BD866F71FE6E5BCD424744803C797227743E99A1F08B2
```

이 APK는 테스트용 디버그 키로 서명되어 직접 전달 테스트에는 사용할 수 있지만 Google Play 정식 배포에는 사용할 수 없다.

릴리스 APK 재생성 명령:

```powershell
cd android
.\gradlew.bat :app:assembleRelease
```

기본 출력 위치:

```text
android/app/build/outputs/apk/release/app-release.apk
```

## 9. 확인 완료 항목

- 실제 Samsung Galaxy 기기에서 설치 및 실행
- 다른 앱 위에서 실제 자동 클릭
- 실행 중 `MOVE` 버튼을 통한 타깃 이동
- 타깃 이동 후 실제 클릭 지속
- 타깃 위치 저장과 복원
- 앱 하단 탭 제거
- Metro 없이 릴리스 APK 독립 실행
- ESLint 통과
- TypeScript 검사 통과
- Android debug 및 release 빌드 성공

## 10. 문제 해결 기록

### 앱이 흰색 원 또는 시작 화면에서 멈추는 경우

오래 실행된 Metro가 이전 패키지 캐시를 사용하고 있을 수 있다.

```powershell
npm.cmd start -- --dev-client --clear
adb reverse tcp:8081 tcp:8081
```

Metro를 재시작한 뒤 앱도 완전히 종료하고 다시 실행한다.

### 앱이 실행되지 않는 것처럼 보이는 경우

- 휴대폰이 잠금 화면 또는 AOD 상태인지 확인한다.
- `adb devices`에서 기기가 `device`로 표시되는지 확인한다.
- 개발 빌드라면 Metro가 8081 포트에서 실행 중인지 확인한다.
- ADB가 재시작되었다면 `adb reverse tcp:8081 tcp:8081`을 다시 실행한다.

### `Unable to activate keep awake` 오류

Expo 개발 모드가 앱 화면을 계속 켜려고 할 때 현재 Activity를 찾지 못해 발생하는 개발 전용 경고다. 자동 클릭 서비스와는 무관하며 독립 실행 릴리스 APK에는 영향을 주지 않는다.

## 11. 남은 작업

1. 반복 테스트 및 발견된 오류 수정
2. 배터리 소비와 30분 이상 장시간 실행 테스트
3. 여러 Android 기기 및 Android 버전에서 최종 테스트
4. 정식 배포가 필요할 경우 전용 릴리스 서명키 생성
5. 필요할 경우 Google Play 정책 확인 및 배포 준비

## 12. 주의사항

- Accessibility Service 권한은 강력한 권한이므로 사용 목적을 명확하게 안내해야 한다.
- 일부 앱이나 보안 화면에서는 Android 정책상 자동 터치가 제한될 수 있다.
- 정식 서명키를 생성하면 이후 업데이트에도 같은 키가 필요하므로 안전하게 보관해야 한다.
- `dist`와 Android 빌드 결과물은 Git에서 제외되므로 APK는 별도로 전달해야 한다.

