"use client";

import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";
import { classifyHand, type Classification, type RecognitionMode } from "@/lib/asl-classifier";
import { upsertCachedHistory } from "@/lib/offline";
import {
  readLocalPreferences,
  textSizeClass,
  writeLocalPreferences,
  type AppPreferences,
  type TextSize,
} from "@/lib/preferences";
import { speak, stopSpeaking } from "@/lib/speech";
import { SignGuide } from "@/components/SignGuide";
import { SIGN_LANGUAGES } from "@/lib/languages";

const HOLD_FRAMES = 14;
const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

type Status = "idle" | "loading" | "live" | "error";

export function WebcamTranslator() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const rafRef = useRef<number>(0);
  const lastVideoTime = useRef(-1);
  const holdRef = useRef({ label: "", count: 0 });
  const wristHistory = useRef<{ x: number; y: number }[]>([]);
  const indexPath = useRef<{ x: number; y: number }[]>([]);
  const zTrace = useRef<number[]>([]);
  const uiRef = useRef({ hands: -1, label: "", progress: -1 });
  const prefsRef = useRef<AppPreferences | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<RecognitionMode>("fingerspell");
  const [language, setLanguage] = useState("asl");
  const [tts, setTts] = useState(true);
  const [textSize, setTextSize] = useState<TextSize>("md");
  const [current, setCurrent] = useState<Classification | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [word, setWord] = useState("");
  const [sentence, setSentence] = useState("");
  const [hands, setHands] = useState(0);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"ok" | "bad">("ok");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const local = readLocalPreferences();
    prefsRef.current = local;
    setLanguage(local.preferredLanguage);
    setMode(local.recognitionMode);
    setTts(local.ttsEnabled);
    setTextSize(local.textSize);
    setReady(true);
  }, []);

  const persistPrefs = useCallback((patch: Partial<AppPreferences>) => {
    const base = prefsRef.current ?? readLocalPreferences();
    const next = { ...base, ...patch };
    prefsRef.current = next;
    writeLocalPreferences(next);
  }, []);

  const appendToken = useCallback(
    (result: Classification) => {
      if (result.kind === "control") {
        if (result.label === "SPACE") {
          setWord((prev) => {
            if (!prev) {
              return prev;
            }
            setSentence((s) => `${s}${s && !s.endsWith(" ") ? " " : ""}${prev}`);
            return "";
          });
        } else if (result.label === "DELETE") {
          setWord((prev) => {
            if (prev) {
              return prev.slice(0, -1);
            }
            setSentence((s) => s.trimEnd().replace(/\s?\S+$/, ""));
            return "";
          });
        }
        return;
      }

      if (result.kind === "phrase") {
        setSentence((s) => `${s}${s && !s.endsWith(" ") ? " " : ""}${result.english}`);
        setWord("");
        if (tts) {
          speak(result.english);
        }
        return;
      }

      setWord((prev) => prev + result.english);
    },
    [tts],
  );

  const loop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !canvas || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    if (lastVideoTime.current !== video.currentTime) {
      lastVideoTime.current = video.currentTime;
      const detections = landmarker.detectForVideo(video, performance.now());
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const count = detections.landmarks.length;
      if (count !== uiRef.current.hands) {
        uiRef.current.hands = count;
        setHands(count);
      }

      if (count === 0) {
        holdRef.current = { label: "", count: 0 };
        if (uiRef.current.label !== "" || uiRef.current.progress !== 0) {
          uiRef.current = { ...uiRef.current, label: "", progress: 0 };
          setCurrent(null);
          setHoldProgress(0);
        }
      }

      detections.landmarks.forEach((landmarks, index) => {
        drawHand(ctx, landmarks, canvas.width, canvas.height);
        if (index !== 0) {
          return;
        }

        const wrist = landmarks[0];
        wristHistory.current = [...wristHistory.current.slice(-16), { x: wrist.x, y: wrist.y }];
        indexPath.current = [...indexPath.current.slice(-18), { x: landmarks[8].x, y: landmarks[8].y }];
        zTrace.current = [...zTrace.current.slice(-16), wrist.z];

        const result = classifyHand(landmarks, mode, {
          waving: isWaving(wristHistory.current),
          zTrace: zTrace.current,
          indexPath: indexPath.current,
        });

        if (!result) {
          holdRef.current = { label: "", count: 0 };
          if (uiRef.current.label !== "") {
            uiRef.current.label = "";
            uiRef.current.progress = 0;
            setCurrent(null);
            setHoldProgress(0);
          }
          return;
        }

        if (holdRef.current.label === result.label) {
          holdRef.current.count += 1;
        } else {
          holdRef.current = { label: result.label, count: 1 };
        }

        const progress = Math.min(1, holdRef.current.count / HOLD_FRAMES);
        if (uiRef.current.label !== result.label || uiRef.current.progress !== progress) {
          uiRef.current.label = result.label;
          uiRef.current.progress = progress;
          setCurrent(result);
          setHoldProgress(progress);
        }

        if (holdRef.current.count === HOLD_FRAMES) {
          appendToken(result);
        }
      });
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [appendToken, mode]);

  const start = useCallback(async () => {
    setError("");
    setStatus("loading");
    try {
      const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      const options = {
        runningMode: "VIDEO" as const,
        numHands: 2,
        minHandDetectionConfidence: 0.6,
        minHandPresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
      };
      try {
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          ...options,
          baseOptions: { modelAssetPath: "/models/hand_landmarker.task", delegate: "GPU" },
        });
      } catch {
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          ...options,
          baseOptions: { modelAssetPath: "/models/hand_landmarker.task", delegate: "CPU" },
        });
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      const video = videoRef.current;
      if (!video) {
        throw new Error("Camera element is missing");
      }
      video.srcObject = stream;
      await video.play();
      setStatus("live");
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not start the camera");
    }
  }, [loop]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const video = videoRef.current;
    const stream = video?.srcObject as MediaStream | undefined;
    stream?.getTracks().forEach((track) => track.stop());
    if (video) {
      video.srcObject = null;
    }
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    setStatus("idle");
    setCurrent(null);
    setHands(0);
    stopSpeaking();
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  function saveTranslation() {
    const text = `${sentence} ${word}`.replace(/\s+/g, " ").trim();
    if (!text) {
      setNoticeTone("bad");
      setNotice("Nothing to save yet.");
      return;
    }
    setSaving(true);
    upsertCachedHistory({
      id: crypto.randomUUID(),
      text,
      signLanguage: language,
      signsDetected: text.replace(/ /g, "").length,
      createdAt: new Date().toISOString(),
    });
    setNoticeTone("ok");
    setNotice("Translation saved on this device.");
    setSaving(false);
  }

  const preview = `${sentence}${sentence && word ? " " : ""}${word}`.trim();

  if (!ready) {
    return <div className="px-5 py-16 text-center text-muted md:px-8">Loading translator…</div>;
  }

  return (
    <div className="grid gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.75fr)] md:px-8">
      <section className="overflow-hidden rounded-[28px] border border-line bg-panel shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between border-b border-line px-5 py-3 text-sm">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${status === "live" ? "bg-live" : "bg-muted"}`} />
            <span>{status === "live" ? "Camera live" : status === "loading" ? "Starting camera" : "Camera off"}</span>
          </div>
          <span className="text-muted">
            {hands} hand{hands === 1 ? "" : "s"} in frame
          </span>
        </div>

        <div className="relative aspect-video bg-black camera-grid">
          <video ref={videoRef} className="absolute inset-0 h-full w-full -scale-x-100 object-cover" playsInline muted />
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full -scale-x-100" />

          {status !== "live" && (
            <div className="absolute inset-0 grid place-items-center bg-black/45 p-6 text-center">
              <div>
                <p className="font-display text-3xl">Stand in the frame</p>
                <p className="mx-auto mt-2 max-w-md text-muted">
                  Allow camera access, then fingerspell or sign a phrase. Hold a sign still to lock it in.
                </p>
                <button
                  type="button"
                  onClick={start}
                  className="mt-5 rounded-full bg-gold px-5 py-2 text-sm text-bg"
                >
                  {status === "loading" ? "Starting…" : "Start camera"}
                </button>
              </div>
            </div>
          )}

          {current && (
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-line bg-bg/80 px-4 py-3 backdrop-blur">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Detected</p>
                <p className="font-display text-3xl leading-none">{current.english || current.label}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gold">{Math.round(current.confidence * 100)}%</p>
                <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-line">
                  <div className="h-full bg-gold" style={{ width: `${holdProgress * 100}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <aside className="flex flex-col gap-4">
        <div className="rounded-[28px] border border-line bg-panel p-5">
          <label className="block text-xs uppercase tracking-[0.2em] text-muted" htmlFor="sentence">
            English translation
          </label>
          <textarea
            id="sentence"
            value={preview}
            onChange={(event) => {
              setSentence(event.target.value);
              setWord("");
            }}
            rows={4}
            className={`mt-3 w-full resize-none rounded-2xl border border-line bg-bg-soft px-4 py-3 leading-relaxed outline-none focus:border-gold ${textSizeClass(textSize)}`}
            placeholder="Your signs will appear here"
            aria-live="polite"
          />
          <p className="mt-2 text-sm text-muted">Current word: {word || "—"}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="rounded-2xl border border-line bg-panel p-3 text-sm">
            <span className="block text-xs uppercase tracking-[0.18em] text-muted">Language</span>
            <select
              className="mt-1 w-full bg-transparent outline-none"
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value);
                persistPrefs({ preferredLanguage: event.target.value });
              }}
            >
              {SIGN_LANGUAGES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="rounded-2xl border border-line bg-panel p-3 text-sm">
            <span className="block text-xs uppercase tracking-[0.18em] text-muted">Mode</span>
            <select
              className="mt-1 w-full bg-transparent outline-none"
              value={mode}
              onChange={(event) => {
                const next = event.target.value as RecognitionMode;
                setMode(next);
                persistPrefs({ recognitionMode: next });
              }}
            >
              <option value="fingerspell">Fingerspell A–Z</option>
              <option value="phrases">Common phrases</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {status === "live" ? (
            <button type="button" onClick={stop} className="rounded-full bg-danger px-4 py-2 text-sm text-bg">
              Stop camera
            </button>
          ) : (
            <button type="button" onClick={start} className="rounded-full bg-gold px-4 py-2 text-sm text-bg">
              {status === "loading" ? "Starting…" : "Start camera"}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setWord((w) => {
                if (!w) {
                  return w;
                }
                setSentence((s) => `${s}${s && !s.endsWith(" ") ? " " : ""}${w}`);
                return "";
              });
            }}
            className="rounded-full border border-line px-4 py-2 text-sm"
          >
            Space
          </button>
          <button
            type="button"
            onClick={() =>
              setWord((w) => {
                if (w) {
                  return w.slice(0, -1);
                }
                setSentence((s) => s.slice(0, -1));
                return "";
              })
            }
            className="rounded-full border border-line px-4 py-2 text-sm"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => {
              if (preview) {
                speak(preview);
              }
            }}
            className="rounded-full border border-line px-4 py-2 text-sm"
          >
            Speak
          </button>
          <button
            type="button"
            onClick={() => {
              const next = !tts;
              setTts(next);
              persistPrefs({ ttsEnabled: next });
            }}
            className={`rounded-full px-4 py-2 text-sm ${tts ? "bg-live text-bg" : "border border-line"}`}
          >
            TTS {tts ? "on" : "off"}
          </button>
          <button
            type="button"
            onClick={saveTranslation}
            disabled={saving}
            className="rounded-full border border-gold px-4 py-2 text-sm text-gold"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setSentence("");
              setWord("");
              setNotice("");
            }}
            className="rounded-full border border-line px-4 py-2 text-sm"
          >
            Clear
          </button>
        </div>

        <label className="rounded-2xl border border-line bg-panel p-3 text-sm">
          <span className="block text-xs uppercase tracking-[0.18em] text-muted">Text size</span>
          <select
            className="mt-1 w-full bg-transparent outline-none"
            value={textSize}
            onChange={(event) => {
              const next = event.target.value as TextSize;
              setTextSize(next);
              persistPrefs({ textSize: next });
            }}
          >
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">Extra large</option>
          </select>
        </label>

        <div className="rounded-[28px] border border-line bg-panel p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Sign guide</p>
          <div className="mt-3">
            <SignGuide current={current?.label} mode={mode} />
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        {notice && <p className={`text-sm ${noticeTone === "bad" ? "text-danger" : "text-live"}`}>{notice}</p>}

        {language === "sasl" && (
          <p className="rounded-2xl border border-line bg-bg-soft p-3 text-sm text-muted">
            SASL fingerspelling uses a one-handed alphabet. Phrase mode still works for everyday signs.
          </p>
        )}
        {language === "bsl" && (
          <p className="rounded-2xl border border-line bg-bg-soft p-3 text-sm text-muted">
            BSL two-handed fingerspelling is limited here. Phrase mode still works for everyday signs.
          </p>
        )}
      </aside>
    </div>
  );
}

function drawHand(
  ctx: CanvasRenderingContext2D,
  landmarks: { x: number; y: number }[],
  width: number,
  height: number,
) {
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(232, 184, 109, 0.9)";
  ctx.fillStyle = "rgba(143, 209, 158, 0.95)";

  for (const [a, b] of CONNECTIONS) {
    ctx.beginPath();
    ctx.moveTo(landmarks[a].x * width, landmarks[a].y * height);
    ctx.lineTo(landmarks[b].x * width, landmarks[b].y * height);
    ctx.stroke();
  }

  for (const point of landmarks) {
    ctx.beginPath();
    ctx.arc(point.x * width, point.y * height, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function isWaving(points: { x: number; y: number }[]) {
  if (points.length < 8) {
    return false;
  }
  const xs = points.map((p) => p.x);
  return Math.max(...xs) - Math.min(...xs) > 0.12;
}
