"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

type ChartExportRow = Record<string, unknown>;

export interface ChartExportMenuProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  exportTitle?: string;
  exportData?: ChartExportRow[];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "chart";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getChartSvg(container: HTMLDivElement) {
  return container.querySelector("svg.recharts-surface") as SVGSVGElement | null;
}

function inlineSvgStyles(svg: SVGSVGElement) {
  const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
  const sourceElements = [svg, ...Array.from(svg.querySelectorAll("*"))];
  const clonedElements = [clonedSvg, ...Array.from(clonedSvg.querySelectorAll("*"))];

  sourceElements.forEach((sourceElement, index) => {
    const clonedElement = clonedElements[index];

    if (!(clonedElement instanceof Element)) {
      return;
    }

    const computedStyle = window.getComputedStyle(sourceElement);
    const stylePairs = [
      ["fill", computedStyle.fill],
      ["stroke", computedStyle.stroke],
      ["stroke-width", computedStyle.strokeWidth],
      ["stroke-dasharray", computedStyle.strokeDasharray],
      ["stroke-linecap", computedStyle.strokeLinecap],
      ["stroke-linejoin", computedStyle.strokeLinejoin],
      ["stroke-opacity", computedStyle.strokeOpacity],
      ["fill-opacity", computedStyle.fillOpacity],
      ["opacity", computedStyle.opacity],
      ["color", computedStyle.color],
      ["font-family", computedStyle.fontFamily],
      ["font-size", computedStyle.fontSize],
      ["font-weight", computedStyle.fontWeight],
      ["font-style", computedStyle.fontStyle],
      ["letter-spacing", computedStyle.letterSpacing],
      ["text-anchor", computedStyle.textAnchor],
      ["dominant-baseline", computedStyle.dominantBaseline],
      ["shape-rendering", computedStyle.shapeRendering],
      ["paint-order", computedStyle.paintOrder],
    ] as const;

    const existingStyle = clonedElement.getAttribute("style");
    const inlinedStyle = stylePairs.map(([property, value]) => `${property}:${value}`).join(";");
    clonedElement.setAttribute("style", existingStyle ? `${existingStyle};${inlinedStyle}` : inlinedStyle);
  });

  return clonedSvg;
}

async function svgToDataUrl(svg: SVGSVGElement) {
  const clonedSvg = inlineSvgStyles(svg);
  clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clonedSvg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

  const serializedSvg = new XMLSerializer().serializeToString(clonedSvg);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serializedSvg)}`;
}

async function svgToCanvas(svg: SVGSVGElement) {
  const dataUrl = await svgToDataUrl(svg);
  const image = new Image();

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Unable to load chart SVG"));
    image.src = dataUrl;
  });

  const viewBox = svg.viewBox.baseVal;
  const width = Math.max(viewBox.width || svg.clientWidth || Number(svg.getAttribute("width")) || 1200, 1);
  const height = Math.max(viewBox.height || svg.clientHeight || Number(svg.getAttribute("height")) || 800, 1);
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas context unavailable");
  }

  context.scale(scale, scale);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return canvas;
}

function toCsv(rows: ChartExportRow[]) {
  const keys = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );

  const escapeCell = (value: unknown) => {
    if (value === null || value === undefined) {
      return "";
    }

    const text = typeof value === "string" ? value : JSON.stringify(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  return [
    keys.join(","),
    ...rows.map((row) => keys.map((key) => escapeCell(row[key])).join(",")),
  ].join("\n");
}

async function exportSvg(container: HTMLDivElement, filename: string) {
  const svg = getChartSvg(container);
  if (!svg) {
    throw new Error("Chart SVG not found");
  }

  const dataUrl = await svgToDataUrl(svg);
  const response = await fetch(dataUrl);
  downloadBlob(await response.blob(), filename);
}

async function exportRaster(container: HTMLDivElement, filename: string, format: "png" | "jpeg") {
  const svg = getChartSvg(container);
  if (!svg) {
    throw new Error("Chart SVG not found");
  }

  const canvas = await svgToCanvas(svg);
  const mimeType = format === "png" ? "image/png" : "image/jpeg";
  const quality = format === "jpeg" ? 0.95 : undefined;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
          return;
        }

        reject(new Error("Failed to generate image blob"));
      },
      mimeType,
      quality,
    );
  });

  downloadBlob(blob, filename);
}

async function exportPdf(container: HTMLDivElement, filename: string) {
  const svg = getChartSvg(container);
  if (!svg) {
    throw new Error("Chart SVG not found");
  }

  const canvas = await svgToCanvas(svg);
  const imageData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
    unit: "px",
    format: [canvas.width, canvas.height],
  });

  pdf.addImage(imageData, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save(filename);
}

function exportJson(rows: ChartExportRow[], filename: string) {
  downloadBlob(new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }), filename);
}

function exportCsv(rows: ChartExportRow[], filename: string) {
  downloadBlob(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }), filename);
}

export function ChartExportMenu({ containerRef, exportTitle, exportData }: ChartExportMenuProps) {
  const filenameBase = slugify(exportTitle || "chart");
  const hasData = Boolean(exportData?.length);

  const handleExport = async (type: "svg" | "png" | "jpeg" | "pdf" | "csv" | "json") => {
    const container = containerRef.current;
    if (!container) {
      toast.error("Chart is not ready for export.");
      return;
    }

    try {
      if (type === "svg") {
        await exportSvg(container, `${filenameBase}.svg`);
      } else if (type === "png") {
        await exportRaster(container, `${filenameBase}.png`, "png");
      } else if (type === "jpeg") {
        await exportRaster(container, `${filenameBase}.jpg`, "jpeg");
      } else if (type === "pdf") {
        await exportPdf(container, `${filenameBase}.pdf`);
      } else if (type === "csv") {
        if (!exportData?.length) {
          toast.error("No tabular data is available for CSV export.");
          return;
        }

        exportCsv(exportData, `${filenameBase}.csv`);
      } else if (type === "json") {
        if (!exportData?.length) {
          toast.error("No tabular data is available for JSON export.");
          return;
        }

        exportJson(exportData, `${filenameBase}.json`);
      }

      toast.success(`${exportTitle || "Chart"} exported.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chart export failed.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-full border border-border/60 bg-background/90 shadow-sm backdrop-blur-sm hover:bg-accent/90"
          aria-label={`Export ${exportTitle || "chart"}`}
        >
          <Download className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem onClick={() => void handleExport("png")}>PNG image</DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handleExport("jpeg")}>JPEG image</DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handleExport("svg")}>SVG image</DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handleExport("pdf")}>PDF document</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!hasData} onClick={() => void handleExport("csv")}>
          CSV data
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!hasData} onClick={() => void handleExport("json")}>
          JSON data
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}