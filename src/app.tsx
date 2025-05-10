import { Button, Rows, Text } from "@canva/app-ui-kit";
import { requestOpenExternalUrl } from "@canva/platform";
import { FormattedMessage, useIntl } from "react-intl";
import * as styles from "styles/components.css";
import { useAddElement } from "utils/use_add_element";
import { useState } from "react";

export const DOCS_URL = "https://www.canva.dev/docs/apps/";

// Valodu saraksts
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

  const onClick = () => {
    addElement({
      type: "text",
      children: ["Hello world!"],
    });
  };

  const openExternalUrl = async (url: string) => {
    const response = await requestOpenExternalUrl({ url });

    if (response.status === "aborted") {
      // user decided not to navigate to the link
    }
  };

  return (
    <div className="p-4">
      <Rows spacing="2u">
        <Text>
          <FormattedMessage
            defaultMessage="
              To make changes to this app, edit the <code>src/app.tsx</code> file,
              then close and reopen the app in the editor to preview the changes.
            "
            description="Instructions for how to make changes to the app. Do not translate <code>src/app.tsx</code>."
            values={{
              code: (chunks) => <code>{chunks}</code>,
            }}
          />
        </Text>

        {/* Valodu izvēle */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Select languages</h3>

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

        <Button variant="primary" onClick={onClick} stretch>
          {intl.formatMessage({
            defaultMessage: "Do something cool",
            description:
              "Button text to do something cool. Creates a new text element when pressed.",
          })}
        </Button>

        <Button variant="secondary" onClick={() => openExternalUrl(DOCS_URL)}>
          {intl.formatMessage({
            defaultMessage: "Open Canva Apps SDK docs",
            description:
              "Button text to open Canva Apps SDK docs. Opens an external URL when pressed.",
          })}
        </Button>
      </Rows>
    </div>
  );
};
