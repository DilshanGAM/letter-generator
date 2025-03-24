"use client";

import { useState } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const expendingPersons = [
  {
    name: "Godakanda Arachchige Malith Dilshan",
    address:
      "No 49/1, Hunnangewatta, Heanpanwila, Waduweliwitiya North Kahaduwa.",
    nic: "199902700422",
  },
  {
    name: "Induruwa Udumullage Nipuna Nadeeshan",
    address: "No 226, Silwadail State, Dodangoda Kalutara.",
    nic: "200010892555",
  },
];

const Page = () => {
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const generatePDF = async () => {
    const data = {
      expenseMadeBy: selectedPerson,
      amount,
      reason,
      additionalInfo,
      date,
    };

    const prompt =
      "I want to write a formal letter for SKYREK Pvt LTD about the given expense. There are two directors: Godakanda Arachchige Malith Dilshan (NIC: 199902700422) and Induruwa Udumullage Nipuna Nadeeshan (NIC: 200010892555). Director 1's address is No 49/1, Hunnangewatta, Heanpanwila, Waduweliwitiya North Kahaduwa. Director 2's address is No 226, Silwadail State, Dodangoda Kalutara. Company address is No 226, Silwadail State, Dodangoda Kalutara. Write me a JSON with a 'topic' and 'content' for a formal expense record letter using this data: " +
      JSON.stringify(data);

    const result = await model.generateContent(prompt);
    let response = result.response.text().replace("```json", "").replace("```", "");
    const { topic, content } = JSON.parse(response);

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { height, width } = page.getSize();

    // Draw background image
    const imageBytes = await fetch("/letterhead.jpg").then((res) =>
      res.arrayBuffer()
    );
    const jpgImage = await pdfDoc.embedJpg(imageBytes);
    page.drawImage(jpgImage, {
      x: 0,
      y: 0,
      width,
      height,
    });

    let y = height - 120;

    const drawLine = () => {
      y -= 8;
      page.drawLine({
        start: { x: 50, y },
        end: { x: width - 50, y },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });
      y -= 12;
    };

    const drawText = (text: string, size = 12, indent = 50, spacing = 18) => {
      page.drawText(text, { x: indent, y, size, font, color: rgb(0, 0, 0) });
      y -= spacing;
    };

    // Split into sections
    const sections = content.split("\n");

    // Draw To:
    for (let i = 0; i < 5 && i < sections.length; i++) {
      drawText(sections[i]);
    }
    drawLine();

    // Draw From:
    for (let i = 5; i < 10 && i < sections.length; i++) {
      drawText(sections[i]);
    }
    drawLine();

    // Draw Date + Subject
    while (sections[y] && !sections[y].toLowerCase().includes("subject")) y++;
    while (sections[y] && sections[y].toLowerCase().includes("subject")) {
      drawText(sections[y]);
      y++;
    }
    drawLine();

    // Draw Body
    for (let i = 10; i < sections.length; i++) {
      const paragraph = sections[i];
      if (!paragraph.trim()) continue;
      const lines = wrapText(paragraph);
      for (const line of lines) {
        drawText(line);
        if (y < 100) break;
      }
    }

    // Signatures
    y -= 50;
    drawLine();
    drawText("Signature of Director 1", 12, 50, 14);
    y -= 50;
    drawLine();
    drawText("Signature of Director 2", 12, 350, 14);

    // Save and download
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "expense-letter.pdf";
    link.click();
  };

  const wrapText = (text: string, maxLineLength = 95) => {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    for (const word of words) {
      if ((currentLine + word).length > maxLineLength) {
        lines.push(currentLine.trim());
        currentLine = word + " ";
      } else {
        currentLine += word + " ";
      }
    }
    if (currentLine.trim()) lines.push(currentLine.trim());
    return lines;
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Generate Expense Report</h1>

      <div className="mb-4">
        <Label htmlFor="person">Select Expending Person</Label>
        <Select
          onValueChange={(value) => setSelectedPerson(value)}
          value={selectedPerson || ""}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Person" />
          </SelectTrigger>
          <SelectContent>
            {expendingPersons.map((p) => (
              <SelectItem key={p.nic} value={p.name}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
        />
      </div>

      <div className="mb-4">
        <Label htmlFor="reason">Reason</Label>
        <Input
          id="reason"
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason"
        />
      </div>

      <div className="mb-4">
        <Label htmlFor="additional-info">Additional Information</Label>
        <Textarea
          id="additional-info"
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          placeholder="Enter additional information"
        />
      </div>

      <div className="mb-4">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <Button onClick={generatePDF}>Generate PDF</Button>
    </div>
  );
};

export default Page;
