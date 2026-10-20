# Awaaz Notes - Hindi Voice to Text

Speak and get Hindi (or English) text. Save notes, copy, share and download for reel scripts and captions.

**Live app:** https://akash991833.github.io/hindi-voice-notes-app/

Free, no sign-up, no ads. Works in the browser, offline after the first visit, and can be installed on your phone (Chrome menu > Add to Home screen / Install app). Everything is saved on your device only.

## Features

- Tap the mic and speak: live text in Hindi (hi-IN), English (India) or English (US)
- Keeps listening until you stop; restarts automatically when the browser pauses
- Voice punctuation: say "पूर्ण विराम", "अल्पविराम", "प्रश्न चिह्न", "नई लाइन" (or full stop, comma, question mark, new line)
- Editable text box, word and character count
- Save notes, search, edit, delete; copy, share (WhatsApp / system share) and .txt download
- JSON backup and restore; dark and light mode; installable

## How to use

1. Open in Chrome (Android or computer) and allow the microphone.
2. Choose the language and tap the mic.
3. Speak in short sentences. Edit the text if needed.
4. Tap Save note, or Copy / Share.

## Screenshots

<img src="screenshots/1-record.png" width="240" alt="1-record">
<img src="screenshots/2-notes.png" width="240" alt="2-notes">
<img src="screenshots/4-light.png" width="240" alt="4-light">

![desktop](screenshots/3-desktop.png)

## Good to know (limits)

- Uses the browser's built-in Web Speech API. Chrome / Edge work best; Firefox does not support it; Safari support is limited.
- The browser sends audio to its own speech service (Google in Chrome), so internet is required. This app has no server and stores nothing outside your browser.
- Accuracy depends on that service, your accent and background noise. Always proofread before using the text.
- Speech recognition was tested with a simulated speech engine in automated tests; real microphone accuracy depends on your device.

## Run it yourself

No build step. Clone the repo and open `index.html`, or serve the folder with any static server:

```bash
git clone https://github.com/AKASH991833/hindi-voice-notes-app.git
cd hindi-voice-notes-app
python3 -m http.server 8080
```

Plain HTML, CSS and JavaScript. No tracking, no external requests (fonts, scripts and data are all local).

## Privacy

No account, no server, no analytics. Data stays in your browser's local storage. Voice recognition is done by your browser's speech service. Clearing browser data deletes it, so use the Backup option if it matters.

## License

MIT
