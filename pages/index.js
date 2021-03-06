import { useState } from "react";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import Papa from "papaparse";
import { useFormState } from "../components/hooks/useFormState";
import { DateTime } from "luxon";
import fixUtf8 from "fix-utf8";

export default function Home() {
  const [
    { headers, data, filename, ...types },
    { checkbox, select, setValue },
  ] = useFormState({
    filename: "",
    headers: [],
    data: [],
  });

  const onChange = (e) => {
    const [file] = e.target.files;

    const [filename] = file.name.split(".");

    setValue(`filename`, `cleaned-${filename}.xlsx`);

    Papa.parse(file, {
      complete: function (results) {
        const [headers, ...data] = results.data;
        setValue("headers", headers);
        headers.forEach((val, i) => {
          setValue(`type-${i}`, "disabled");
        });
        setValue("data", data);
      },
    });
  };

  const save = async (e) => {
    const outputHeader = [];

    headers.forEach((header, i) => {
      const key = `type-${i}`;
      const type = types[key];

      if (type === "disabled") {
        return;
      }

      outputHeader.push(header);
    });

    const output = [];

    data.forEach((row) => {
      const thisRow = [];
      row.forEach((val, i) => {
        const key = `type-${i}`;
        const type = types[key];

        if (type === "disabled") {
          return null;
        }

        if (type === "string") {
          thisRow.push(fixUtf8(String(val)));
          return;
        }

        if (type === "number") {
          thisRow.push(Number(val));
          return;
        }

        if (type === "M/d/yyyy") {
          thisRow.push(DateTime.fromFormat(val, "M/d/yyyy").toISODate());
        }
      });

      output.push(thisRow);
    });

    const response = await fetch(`/api/xlsx`, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow", // manual, *follow, error
      body: JSON.stringify({
        data: [outputHeader, ...output],
        filename,
      }), // body data type must match "Content-Type" header
    });

    const blob = await response.blob();
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>CSV to XLS</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <input type="file" onChange={onChange} />

      <button onClick={save}>Save</button>

      <table style={{ border: "1px" }}>
        <thead>
          <tr>
            {headers.map((head, index) => {
              return (
                <th key={index}>
                  <p>{head}</p>
                  <select {...select(`type-${index}`)}>
                    <option>disabled</option>
                    <option>string</option>
                    <option value="M/d/yyyy">date (M/d/yyyy)</option>
                    {/* <option>date (day/month/year)</option>
                    <option>date (year/month/day)</option> */}
                    {/* <option>datetime</option> */}
                    <option>number</option>
                  </select>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {data.map((row, index) => {
            return (
              <tr key={index}>
                {row.map((col, index2) => {
                  return <td key={`${index}-${index2}`}>{col}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
