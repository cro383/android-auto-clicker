# Android Auto Clicker 현재 상태

최종 업데이트: 2026-07-30
현재 기준 커밋: `fc2a502`

## 1. 프로젝트 개요

이 프로젝트는 Android 전용 자동 클릭 앱이다. Expo 데모가 아니라 다른 Android 앱 위에서 실제 터치를 실행하는 앱을 목표로 하며, 현재 핵심 네이티브 기능이 구현되어 있다.

주요 기술:

- Expo SDK 54.0.36
- React Native 0.81.5
- React 19.1
- Expo Router
- TypeScript
- Kotlin
- Android Accessibility Service
- `dispatchGesture()`
- `WindowManager` 오버레이
- AsyncStorage

iOS는 지원 범위에 포함되지 않는다. 웹 버전은 UI 시연용이며 실제 Android 터치를 실행하지 않는다.

## 2. 현재 구현된 기능

### 실제 Android 자동 클릭

- Accessibility Service를 통한 실제 터치 실행
- `dispatchGesture()` 기반 단일 지점 반복 탭
- 다른 앱 위에서 백그라운드 자동 클릭
- 클릭 간격 범위: 100ms~5000ms
- 클릭 간격 조절 단위: 100ms
- 네이티브 클릭 횟수 및 실행 상태를 React Native와 동기화

### 플로팅 타깃

- 다른 앱 위에 빨간색 클릭 타깃 표시
- 타깃 중심점을 실제 클릭 좌표로 사용
- 정지 상태에서 타깃 직접 드래그
- 실행 중에는 별도 `MOVE` 핸들로 타깃 이동
- 위치 이동 중 자동 클릭 일시 정지
- 타깃 위치 저장 및 앱 재실행 후 복원
- 화면 크기와 방향 변경 시 화면 밖으로 벗어나지 않도록 보정

### 시작·정지 컨트롤

- 기능은 기존 시작·정지 동작을 유지
- 버튼 문구는 다음 동작이 아니라 현재 상태를 표시
- 정지 상태: `정지`, 빨간색
- 실행 상태: `시작`, 초록색
- 앱 화면, 웹 데모, 네이티브 플로팅 컨트롤에 동일하게 적용

### 외부 사용자 터치 보완

- 플로팅 컨트롤 창에 `FLAG_NOT_TOUCH_MODAL`과 `FLAG_WATCH_OUTSIDE_TOUCH` 적용
- 사용자가 플로팅 컨트롤 밖을 누르면 `ACTION_OUTSIDE`로 감지
- 외부 앱의 실제 터치는 그대로 전달
- 사용자 터치 감지 후 자동 클릭을 200ms 동안 보류
- 자동 클릭이 생성한 제스처는 사용자 입력 감지에서 제외

Android는 다른 앱의 전체 터치 스트림을 소비하지 않고 감시하는 기능을 제한한다. 현재 구현은 일반적인 짧은 탭 충돌을 줄이기 위한 방식이며, 긴 드래그 전체를 추적하지는 않는다.

## 3. Android 권한 처리

필요한 특수 권한:

1. Accessibility Service
2. Display over other apps

두 권한은 카메라나 알림 같은 일반 런타임 권한이 아니다. 앱이 직접 승인할 수 없으며 사용자가 Android 설정 화면에서 스위치를 켜야 한다.

현재 권한 흐름:

- 접근성 권한 판정에 `AccessibilityManager.getEnabledAccessibilityServiceList()` 사용
- 연결된 Accessibility Service 인스턴스도 함께 확인
- 앱이 활성 상태로 돌아올 때 권한 상태 자동 갱신
- 두 권한이 모두 있어야 플로팅 타깃 버튼 활성화

### 최초 실행 권한 안내

- 권한이 부족한 최초 실행에서 안내 팝업 표시
- `권한 설정 시작` 선택 시 접근성 설정 화면으로 이동
- 접근성 승인 후 앱으로 돌아오면 오버레이 권한 설정 화면으로 연결
- 두 권한이 모두 승인되면 완료 안내
- 권한을 승인하지 않고 돌아오면 설정 화면 반복 실행 중단
- 권한 패널의 `권한 설정 시작` 버튼으로 언제든 재시도 가능
- 최초 안내 여부는 AsyncStorage 키 `auto-clicker/permission-guide-shown`에 저장

## 4. 주요 파일

### React Native

- `app/(tabs)/index.tsx`: 메인 화면
- `components/auto-click-panel.tsx`: 실행 상태, 클릭 횟수, 간격 및 컨트롤
- `components/permission-panel.tsx`: 권한 상태와 순차 권한 설정 안내
- `components/draggable-target.tsx`: 앱 내부 타깃 및 좌표 이동
- `components/web-demo-auto-clicker.tsx`: 브라우저 시연 화면
- `hooks/use-auto-click-engine.ts`: React Native와 네이티브 실행 상태 연결
- `lib/auto-clicker-native.ts`: Kotlin 네이티브 모듈 인터페이스
- `lib/target-position-storage.ts`: 앱 내부 타깃 위치 저장

### Android 네이티브

- `AutoClickerAccessibilityService.kt`: 실제 클릭, 타이머, 플로팅 타깃, 컨트롤 및 사용자 터치 보완
- `AutoClickerModule.kt`: React Native에서 호출하는 네이티브 API와 권한 확인
- `AutoClickerPackage.kt`: 네이티브 모듈 등록
- `MainApplication.kt`: React Native 패키지 연결
- `AndroidManifest.xml`: 접근성 서비스 및 오버레이 권한 선언
- `auto_clicker_accessibility_service.xml`: Accessibility Service 기능 설정

## 5. 사용 방법

1. 앱을 실행한다.
2. 권한이 없다면 `권한 설정 시작`을 누른다.
3. Android 접근성 설정에서 `Auto Clicker`를 활성화한다.
4. 앱으로 돌아온 뒤 다른 앱 위에 표시 권한을 허용한다.
5. `Floating target`을 표시한다.
6. 빨간 타깃을 클릭할 지점으로 이동한다.
7. 클릭 간격을 설정한다.
8. 플로팅 컨트롤로 자동 클릭을 실행하거나 정지한다.
9. 실행 중 타깃 위치를 바꾸려면 `MOVE` 핸들을 드래그한다.

## 6. 개발 및 검증 명령

의존성 설치:

```powershell
npm install
```

Lint:

```powershell
npm.cmd run lint
```

TypeScript 검사:

```powershell
npx.cmd tsc --noEmit
```

Android Kotlin 컴파일:

```powershell
cd android
.\gradlew.bat :app:compileDebugKotlin
```

단독 설치 가능한 release APK:

```powershell
cd android
$env:NODE_ENV='production'
.\gradlew.bat :app:assembleRelease
```

출력 위치:

```text
android/app/build/outputs/apk/release/app-release.apk
```

실제 스마트폰 업데이트 설치:

```powershell
adb -s <DEVICE_ID> install -r android/app/build/outputs/apk/release/app-release.apk
```

## 7. 현재 APK

현재 소스 기준 release APK:

```text
android/app/build/outputs/apk/release/app-release.apk
```

- 파일 크기: 82,582,792 bytes (78.76 MB)
- SHA-256: `3AF7C049FFE5B56A9FB3D652569E2E9AD9F0A6EEE19C1C54A804937FC6EE7BFA`
- 기준 커밋: `fc2a50251ea370344929ba83554b9791d49c8618`
- Metro 개발 서버 없이 단독 실행 가능
- 현재 release 빌드는 개발용 debug 키로 서명됨

Google Play 정식 배포 전에는 별도의 안전한 release 서명키가 필요하다.

## 8. 실제 기기 검증

주 테스트 기기:

- 모델: Samsung Galaxy S23 (`SM-S916N`)
- ADB 장치 ID: `R3CWA0L9A3D`

검증된 항목:

- release APK 업데이트 설치
- 앱 실행
- 접근성 서비스 활성화 유지
- 다른 앱 위 플로팅 타깃
- 실제 자동 클릭
- 타깃 위치 이동 및 저장
- 한글 시작·정지 표시와 색상
- 외부 터치 후 200ms 자동 클릭 보류
- Expo lint
- TypeScript 검사
- Kotlin debug/release 컴파일
- release APK 단독 실행

## 9. 주요 변경 기록

- `4435c12`: 접근성 권한 상태 판정 개선 및 플로팅 문구 변경
- `c73e5bc`: 앱과 웹 컨트롤 한글화
- `a36274d`: 접근성 이벤트 기반 사용자 터치 보류 시도
- `6d8b970`: `ACTION_OUTSIDE` 기반 사용자 터치 감지로 교체
- `cdb244b`: 외부 터치 보류 시간을 200ms로 변경
- `fc2a502`: 순차 Android 권한 설정 안내 추가

## 10. 복원 기준

사용자 터치 보완 방식의 이전 상태:

```text
a36274d
```

현재 권장 상태:

```text
fc2a502
```

복원이 필요하면 전체 저장소를 임의로 초기화하지 말고, 해당 커밋의 관련 파일 차이를 확인한 뒤 필요한 변경만 되돌린다.

## 11. 알려진 제한과 위험

- Accessibility Service와 오버레이 권한은 앱이 자동 승인할 수 없다.
- Android 또는 제조사 배터리 정책이 접근성 서비스를 실제로 해제하면 사용자가 다시 허용해야 한다.
- `dispatchGesture()`는 진행 중인 실제 사용자 제스처와 충돌할 수 있다.
- 현재 200ms 보류는 일반 탭 충돌을 줄이지만 긴 스크롤 전체를 보호하지는 않는다.
- 일부 보안 화면과 앱은 Android 정책상 자동 터치를 제한할 수 있다.
- 사용자 기기마다 오버레이 및 배터리 최적화 정책이 다를 수 있다.
- 정식 배포 시 Accessibility Service 사용 목적과 Google Play 정책을 별도로 검토해야 한다.

## 12. 다음 작업 후보

- 다양한 Android 버전과 제조사 기기 테스트
- 장시간 실행 및 배터리 사용량 측정
- 외부 터치 충돌 사례 추가 수집
- 사용자 설정 가능한 외부 터치 보류 시간
- 정식 release 키 및 배포 파이프라인 구성
- Google Play Accessibility API 정책 검토
