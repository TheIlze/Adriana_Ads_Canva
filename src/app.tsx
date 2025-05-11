import { Button, Rows, MultilineInput } from "@canva/app-ui-kit";
import { requestOpenExternalUrl } from "@canva/platform";
import { FormattedMessage, useIntl } from "react-intl";
import * as styles from "styles/components.css";
import { useAddElement } from "utils/use_add_element";
import { useState, useEffect } from "react";
import { selection } from "@canva/design";

export const DOCS_URL = "https://www.canva.dev/docs/apps/";

const allLanguages = [
  { label: "ar – Arabic", value: "ar" },
  { label: "bg – Bulgarian", value: "bg" },
  { label: "cs – Czech", value: "cs" },
  { label: "da – Danish", value: "da" },
  { label: "de – German", value: "de" },
  { label: "el – Greek", value: "el" },
  { label: "es – Spanish", value: "es" },
  { label: "et – Estonian", value: "et" },
  { label: "fi – Finnish", value: "fi" },
  { label: "fr – French", value: "fr" },
  { label: "ga – Irish", value: "ga" },
  { label: "he – Hebrew", value: "he" },
  { label: "hr – Croatian", value: "hr" },
  { label: "hu – Hungarian", value: "hu" },
  { label: "it – Italian", value: "it" },
  { label: "ka – Georgian", value: "ka" },
  { label: "nl – Dutch", value: "nl" },
  { label: "no – Norwegian", value: "no" },
  { label: "pl – Polish", value: "pl" },
  { label: "pt – Portuguese", value: "pt" },
  { label: "ro – Romanian", value: "ro" },
  { label: "ru – Russian", value: "ru" },
  { label: "sk – Slovak", value: "sk" },
  { label: "sr – Serbian", value: "sr" },
  { label: "sv – Swedish", value: "sv" },
  { label: "uk – Ukrainian", value: "uk" },
];

export const App = () => {
  const addElement = useAddElement();
  const intl = useIntl();

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [context, setContext] = useState("");
  const [textElements, setTextElements] = useState<{ id: string; text: string }[]>([]);
  const [translationsByLang, setTranslationsByLang] = useState<{ [lang: string]: { id: string; translation: string }[] }>({});
  const [sourceLanguage, setSourceLanguage] = useState<string>("en");
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const unregister = selection.registerOnChange({
      scope: "plaintext",
      onChange: async (event) => {
        try {
          const draft = await event.read();
          const contents = draft.contents;

          const elements = contents.map((content, index) => ({
            id: `text-${index}`,
            text: content.text,
          }));

          setTextElements(elements);
        } catch (error) {
          console.error("Neizdevās nolasīt tekstus:", error);
        }
      },
    });

    return () => unregister();
  }, []);

  const isAllSelected = selectedLanguages.length === allLanguages.length;

  const toggleLanguage = (value: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const toggleAllLanguages = () => {
    setSelectedLanguages(isAllSelected ? [] : allLanguages.map((l) => l.value));
  };

  const translateTexts = async () => {
    setIsTranslating(true);
    try {
      const prompt = `
You are a professional translator.

Translate the following text blocks into ${selectedLanguages.join(", ")} based on the context provided. 
Return the result only as a valid JSON object where keys are language codes and values are arrays of:
[
  { "id": "abc", "translation": "..." }
]

Each translation must:
- be as close in meaning and tone to the original as possible,
- match the original text length as closely as possible (character count),
- avoid line breaks unless they are in the original.

Context: ${context}

Original texts:
${JSON.stringify(textElements, null, 2)}
      `;

      const response = await fetch(`${process.env.CANVA_BACKEND_HOST}/api/openai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      setTranslationsByLang(data);

      const detectionPrompt = `Detect the language of the following text:\n\n${textElements.map(e => e.text).join("\n")}`;
      const detectionRes = await fetch(`${process.env.CANVA_BACKEND_HOST}/api/openai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: detectionPrompt }),
      });

      const detectionData = await detectionRes.json();
      const detectedLang = detectionData.text?.trim().toLowerCase() || "en";
      setSourceLanguage(detectedLang);
    } catch (err) {
      console.error("Tulkošanas kļūda:", err);
    } finally {
      setIsTranslating(false);
    }
  };

  const openExternalUrl = async (url: string) => {
    const response = await requestOpenExternalUrl({ url });
    if (response.status === "aborted") {
      // user aborted
    }
  };

  return (
    <div className="p-4">
      <Rows spacing="2u">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-1">Context for translation</h3>
          <MultilineInput
            placeholder="e.g. Ad for promoting 10 day slimming challenge"
            value={context}
            onChange={(value) => setContext(value)}
          />
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-1">Select languages</h3>
          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleAllLanguages}
              className="mr-2"
            />
            <label className="text-sm font-medium">Select all</label>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
              {allLanguages.slice(0, Math.ceil(allLanguages.length / 2)).map((lang) => (
                <label key={lang.value} style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
                  <input
                    type="checkbox"
                    checked={selectedLanguages.includes(lang.value)}
                    onChange={() => toggleLanguage(lang.value)}
                    style={{ marginRight: "0.5rem" }}
                  />
                  {lang.label}
                </label>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
              {allLanguages.slice(Math.ceil(allLanguages.length / 2)).map((lang) => (
                <label key={lang.value} style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
                  <input
                    type="checkbox"
                    checked={selectedLanguages.includes(lang.value)}
                    onChange={() => toggleLanguage(lang.value)}
                    style={{ marginRight: "0.5rem" }}
                  />
                  {lang.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <Button variant="primary" onClick={translateTexts} stretch disabled={isTranslating}>
          {isTranslating ? "Adriana is translating..." : "Translate"}
        </Button>

        {isTranslating && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "12px" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                border: "3px solid #ccc",
                borderTop: "3px solid #333",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        )}

        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>

        {Object.keys(translationsByLang).length > 0 && (
          <div className="mt-6">
            <div className="mb-4">
              <h3 className="text-md font-semibold mb-1">
                Original – {sourceLanguage.toUpperCase()}
              </h3>
              {textElements.map((t, i) => (
                <div key={t.id} className="text-sm mb-1">
                  ({i + 1}) {t.text}
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-md font-semibold mb-1">Translated</h3>
              {selectedLanguages.map((lang) => (
                <div key={lang} className="mb-4">
                  <p className="font-semibold">
                    {lang} – {allLanguages.find(l => l.value === lang)?.label?.split("–")[1]}
                  </p>
                  {translationsByLang[lang]?.map((item, i) => (
                    <div key={item.id} className="mb-2 text-sm flex items-start gap-2">
                      <span>({i + 1})</span>
                      <textarea
                        value={item.translation}
                        onChange={(e) => {
                          const updated = [...(translationsByLang[lang] || [])];
                          updated[i] = { ...updated[i], translation: e.target.value };
                          setTranslationsByLang({ ...translationsByLang, [lang]: updated });
                        }}
                        className="border p-2 rounded w-full"
                        style={{
                          height: "auto",
                          overflow: "hidden",
                          width: "90%",
                          fontSize: "12px",
                          resize: "none",
                        }}
                        onInput={(e) => {
                          const el = e.target as HTMLTextAreaElement;
                          el.style.height = "auto";
                          el.style.height = el.scrollHeight + "px";
                        }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <Button variant="secondary" onClick={() => openExternalUrl(DOCS_URL)}>
          {intl.formatMessage({
            defaultMessage: "Open Canva Apps SDK docs",
            description: "Button text to open Canva Apps SDK docs.",
          })}
        </Button>
      </Rows>
    </div>
  );
};
