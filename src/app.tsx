import { Button, Rows, MultilineInput } from "@canva/app-ui-kit";
import { requestOpenExternalUrl } from "@canva/platform";
import { useState, useEffect } from "react";
import { selection } from "@canva/design";
import { useIntl } from "react-intl";
import { editContent } from "@canva/design";

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
  const intl = useIntl();

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [context, setContext] = useState("");
  const [textElements, setTextElements] = useState<{ id: string; text: string }[]>([]);
  const [translationsByLang, setTranslationsByLang] = useState<{ [lang: string]: { id: string; translation: string }[] }>({});
  const [sourceLanguage, setSourceLanguage] = useState<string>("en");
  const [isTranslating, setIsTranslating] = useState(false);

  // === AUTHORIZATION ===

  const handleAuthorize = () => {
    window.open("http://127.0.0.1:3001/api/auth", "_blank");
  };

  // === HANDLE TEXT SELECTION FROM CANVA DESIGN ===

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
          console.error("Couldn't read text:", error);
        }
      },
    });

    return () => unregister();
  }, []);

  // === LANGUAGE SELECTION HANDLERS ===

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

  // === TRANSLATION LOGIC WITH OPENAI ===

  const translateTexts = async () => {
    setIsTranslating(true);
    try {
      const prompt = `
You are a professional translator. You help us in creating marketing materials for products and recipes related to weight loss, keto, fasting, and healthy living. 
Audience: health-conscious people.
Translate the following text blocks into ${selectedLanguages.join(", ")} based on the context provided. Before making the translation, please read all the texts to understand their interconnection and context.
Return the result only as a valid JSON object where keys are language codes and values are arrays of:
[
  { "id": "abc", "translation": "..." }
]
Each translation must:
- sound native and as close in meaning and tone to the original as possible,
- style the text as a conversational and engaging marketing copy,
- use informal and friendly tone,
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

      const detectionPrompt = `Detect the language of the following text.
      Return only the result as a JSON object with the format: { "language": "en - English" }
      Text: ${textElements.map(e => e.text).join("\n")}
      `;

      const detectionRes = await fetch(`${process.env.CANVA_BACKEND_HOST}/api/openai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: detectionPrompt }),
      });

      const detectionData = await detectionRes.json();
      const detectedLang = detectionData.text?.trim().toLowerCase() || "en";
      setSourceLanguage(detectedLang);
    } catch (err) {
      console.error("Translation error:", err);
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

  // === INSERT TRANSLATION BACK INTO CANVA DESIGN ===

  const handleInsertTranslation = async (lang: string) => {
    try {
      const translations = translationsByLang[lang];
      if (!translations) return;
  
      await editContent(
        {
          target: "current_page",
          contentType: "richtext",
        },
        async (draft) => {
          draft.contents.forEach((block, index) => {
            const translated = translations[index];
            if (!translated) return;
  
            const regions = block.readTextRegions();
            const totalLength = regions.reduce((sum, region) => sum + region.text.length, 0);
  
            block.replaceText(
              { index: 0, length: totalLength },
              translated.translation
            );
          });
  
          await draft.sync();
        }
      );
  
      console.log(`✅ Inserted translations for ${lang}`);
    } catch (err) {
      console.error("❌ Could not insert translated text:", err);
    }
  };
  
  
  return (
    <div className="p-4">
      <Rows spacing="2u">

        {/* 👇 Button for authotrisation - maybe we will need later
        <Button
          variant="primary"
          onClick={handleAuthorize}
        >
          Authorise with Canva
        </Button>
        */}

        {/* Context input */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-1">Context for translation</h3>
          <MultilineInput
            placeholder="e.g. Ad for promoting 10 day slimming challenge"
            value={context}
            onChange={(value) => setContext(value)}
          />
        </div>

        {/* Language selection */}
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

        {/* Translate button */}
        <Button variant="primary" onClick={translateTexts} stretch disabled={isTranslating}>
          {isTranslating ? "Adriana is translating..." : "Translate"}
        </Button>

        {/* Loading spinner */}
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

        {/* Translations preview */}
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
                  
                  {/* Button for inserting translations */}
                  <Button
                    variant="primary"
                    onClick={() => handleInsertTranslation(lang)}
                  >
                    Insert
                  </Button>
                </div>
              ))}
            </div>

          </div>
        )}
      </Rows>
    </div>
  );
};