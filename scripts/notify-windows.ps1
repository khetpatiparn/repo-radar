<#
.SYNOPSIS
    RepoRadar - Windows Native Toast Notification Script
.DESCRIPTION
    ดึงข้อมูล Trending Repositories ล่าสุดจาก RepoRadar แล้วแสดงการแจ้งเตือนแบบ Windows Toast Notification (มุมขวาล่าง)
    สามารถรันด้วยตนเอง หรือตั้งเวลาด้วย Windows Task Scheduler ได้
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\scripts\notify-windows.ps1
#>

param (
    [string]$Url = "https://raw.githubusercontent.com/khetpatiparn/repo-radar/main/data/repositories.json",
    [string]$SiteUrl = "https://repo-radar-lyart.vercel.app/"
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "📡 กำลังดึงข้อมูลจาก RepoRadar..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 10
    $repos = $response
    
    if (-not $repos -or $repos.Count -eq 0) {
        $topTitle = "RepoRadar: ตรวจพบอัปเดตใหม่"
        $topBody = "คลิกเพื่อดู GitHub Repositories กำลังมาแรงวันนี้"
    } else {
        $top = $repos[0]
        $topTitle = "RepoRadar // Trending #1: $($top.owner)/$($top.name)"
        $starsToday = if ($top.stars_today) { "+$($top.stars_today) ดาววันนี้" } else { "$($top.stars) ดาว" }
        $thaiPitch = if ($top.thai_summary) { $top.thai_summary } else { $top.one_line_pitch }
        $topBody = "[$starsToday | Hype $($top.hype_score)/10] $thaiPitch"
    }
} catch {
    $topTitle = "RepoRadar // แจ้งเตือนประจำวัน"
    $topBody = "คลิกเพื่อตรวจสอบเทรนด์ GitHub Repositories ล่าสุด"
}

# Windows 10/11 Toast Notification via WinRT
try {
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] > $null

    # XML Toast with AppId and activation URL
    $template = @"
<toast launch="$SiteUrl" activationType="protocol">
    <visual>
        <binding template="ToastGeneric">
            <text>$([System.Security.SecurityElement]::Escape($topTitle))</text>
            <text>$([System.Security.SecurityElement]::Escape($topBody))</text>
            <text>คลิกเพื่อเปิดดูรายละเอียดบน RepoRadar</text>
        </binding>
    </visual>
    <actions>
        <action content="เปิด RepoRadar" arguments="$SiteUrl" activationType="protocol"/>
    </actions>
</toast>
"@

    $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
    $xml.LoadXml($template)

    $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
    $appId = "{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe"
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId).Show($toast)

    Write-Host "✅ ส่ง Windows Notification สำเร็จ! (ดูที่มุมขวาล่างของจอภาพ)" -ForegroundColor Green
} catch {
    # Fallback to NotifyIcon balloon tip if WinRT Toast is blocked/restricted
    Add-Type -AssemblyName System.Windows.Forms
    $notify = New-Object System.Windows.Forms.NotifyIcon
    $notify.Icon = [System.Drawing.SystemIcons]::Information
    $notify.BalloonTipTitle = $topTitle
    $notify.BalloonTipText = $topBody
    $notify.Visible = $true
    $notify.ShowBalloonTip(5000)
    Write-Host "✅ แสดง Balloon Notification สำเร็จ!" -ForegroundColor Green
}
