import { describe, it, expect } from "vitest";
import { parseCsv, csvToObjects } from "../src/assets/js/lib/sheet-csv.js";

describe("parseCsv", () => {
  it("Given_SimpleRows_When_Parsed_Then_ReturnsCells", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([["a", "b", "c"], ["1", "2", "3"]]);
  });

  it("Given_QuotedFieldWithComma_When_Parsed_Then_KeepsCommaInsideCell", () => {
    expect(parseCsv('title,body\n"Hello, world",text')).toEqual([["title", "body"], ["Hello, world", "text"]]);
  });

  it("Given_QuotedFieldWithNewline_When_Parsed_Then_KeepsNewlineInsideCell", () => {
    expect(parseCsv('a,b\n"line one\nline two",x')).toEqual([["a", "b"], ["line one\nline two", "x"]]);
  });

  it("Given_EscapedQuote_When_Parsed_Then_UnescapesToSingleQuote", () => {
    expect(parseCsv('a\n"She said ""hi"""')).toEqual([["a"], ['She said "hi"']]);
  });

  it("Given_CrLfLineEndings_When_Parsed_Then_NoStrayCarriageReturns", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("Given_TrailingBlankLine_When_Parsed_Then_Ignored", () => {
    expect(parseCsv("a,b\n1,2\n\n")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("Given_EmptyText_When_Parsed_Then_EmptyArray", () => {
    expect(parseCsv("")).toEqual([]);
  });
});

describe("csvToObjects", () => {
  it("Given_HeaderRow_When_Converted_Then_ObjectsKeyedByTrimmedHeader", () => {
    const rows = csvToObjects("Title , Date\nPicnic,2026-10-10");
    expect(rows).toEqual([{ Title: "Picnic", Date: "2026-10-10" }]);
  });

  it("Given_ShortRow_When_Converted_Then_MissingCellsAreEmptyStrings", () => {
    expect(csvToObjects("Title,Date,Body\nPicnic")).toEqual([{ Title: "Picnic", Date: "", Body: "" }]);
  });

  it("Given_OnlyHeader_When_Converted_Then_EmptyArray", () => {
    expect(csvToObjects("Title,Date")).toEqual([]);
  });
});
