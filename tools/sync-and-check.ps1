# Copies the shared code (tools/shared) into all three apps, then type-checks and builds each one.
# Usage (PowerShell):  & 'D:\Hostel maintainance\student-hm\tools\sync-and-check.ps1'
$ErrorActionPreference = 'Continue'
$root = 'D:\Hostel maintainance'
$env:Path += ";$env:LOCALAPPDATA\Programs\nodejs"
$shared = "$root\student-hm\tools\shared\src"
$files = 'fig\Fig.tsx', 'fig\preload.ts', 'fig\extras.tsx', 'fig\mascot.tsx', 'fig\anim.tsx', 'ds\stage.tsx', 'ds\viewport.ts', 'ds\nav.tsx'
$log = "$root\sync-check.log"; '' | Set-Content $log
foreach ($r in 'student-hm', 'technician-hm', 'supervisor-hm') {
  foreach ($f in $files) { if (Test-Path "$shared\$f") { Copy-Item "$shared\$f" "$root\$r\src\$f" -Force } }
  Set-Location "$root\$r"
  "== $r" | Add-Content $log
  $t = npx tsc -b 2>&1 | Out-String; if ($t.Trim()) { $t | Add-Content $log } else { 'types ok' | Add-Content $log }
  (npx vite build 2>&1 | Select-String 'built in|rror') | Out-String | Add-Content $log
}
'DONE' | Add-Content $log
Get-Content $log
