'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  Image,
} from '@react-pdf/renderer';
import { format } from 'date-fns';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_API_KEY });

const expendingPersons = [
  {
    name: 'Godakanda Arachchige Malith Dilshan',
    address:
      'No 49/1, Hunnangewatta, Heanpanwila, Waduweliwitiya North Kahaduwa.',
    nic: '199902700422',
  },
  {
    name: 'Induruwa Udumullage Nipuna Nadeeshan',
    address: 'No 226, Silwadail State, Dodangoda Kalutara.',
    nic: '200019401491',
  },
];

const PDFDoc = ({
  expender,
  amount,
  description,
  vendor,
  paymentDate,
  reason,
}: {
  expender: (typeof expendingPersons)[0];
  amount: number;
  description: string;
  vendor: string;
  paymentDate: string;
  reason: string;
}) => (
  <Document>
    <Page
      size="A4"
      style={{
        position: 'relative',
        padding: 0,
        
      }}
    >
      

      <View
        style={{
          paddingTop: 250,
          paddingHorizontal: 50,
          paddingBottom: 60,
          fontSize: 11,
          lineHeight: 1.5,
          height: '100%',
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          Joint Expense Approval Acknowledgement
        </Text>

        <Text>Date: {format(new Date(), 'yyyy-MM-dd')}</Text>
        <Text>Expense Description: {description}</Text>
        <Text>Amount: Rs. {amount.toFixed(2)}</Text>
        <Text>Date of Payment: {paymentDate}</Text>
        <Text>Paid By: {expender.name}</Text>
        <Text>NIC: {expender.nic}</Text>
        <Text>Address: {expender.address}</Text>
        <Text>Vendor/Service Provider: {vendor}</Text>
        <Text>Reason/Justification: {reason}</Text>

        <View style={{ marginTop: 20 }}>
          <Text>
            We, the partners of the company, confirm that we were both made
            aware of the above expense at the time of incurring it, and we both
            approve it as a valid business-related expense.
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 40,
            position: 'absolute',
            bottom: 60,
          }}
        >
          <View style={{ width: '45%' }}>
            <Text>_________________________</Text>
            <Text>{expendingPersons[0].name}</Text>
          </View>
          <View style={{ width: '45%' }}>
            <Text>_________________________</Text>
            <Text>{expendingPersons[1].name}</Text>
          </View>
        </View>
      </View>
      {/* A4 size = 595.28 x 841.89 pt */}
      <Image
        src="/letterhead.jpg"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 595.28,
          height: 841.89,
          zIndex: -1,
        }}
      />
    </Page>
  </Document>
);

export default function HomePage() {
  const [expender, setExpender] = useState<typeof expendingPersons[0] | null>(
    null
  );
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [vendor, setVendor] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [reason, setReason] = useState('');

  async function enhanceUsingGemini(){
    const data = {
      amount,
      description,
      vendor,
      paymentDate,
      reason,
    }
    const dataInString = JSON.stringify(data);
    const prompt = `Below information are meant to be included in a Joint Expense Approval Acknowledgement legal document enhance the vendor, description and reason to a matching language for a legal document and remove any grammatical error of the json given and provide me with a json same as given. ${dataInString}`;
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    console.log(response);
    const enhancedData = response.text;
    //remove ```json and ``` from the string
    const enhancedDataWithoutJson = enhancedData?.replace('```json','');
    const enhancedDataWithoutJsonEnd = enhancedDataWithoutJson?.replace('```','');
    const enhancedDataInJson = JSON.parse(enhancedDataWithoutJsonEnd||"{}");
    //set reason and desctription and vendor from it if available
    if(enhancedDataInJson.reason){
      setReason(enhancedDataInJson.reason);
    }
    if(enhancedDataInJson.description){
      setDescription(enhancedDataInJson.description);
    }
    if(enhancedDataInJson.vendor){
      setVendor(enhancedDataInJson.vendor);
    }
  }


  const isReady =
    expender && amount && description && vendor && paymentDate && reason;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Joint Expense Form</h1>

      <Select
        onValueChange={(value) => {
          const person = expendingPersons.find((p) => p.nic === value);
          setExpender(person || null);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Expending Partner" />
        </SelectTrigger>
        <SelectContent>
          {expendingPersons.map((person) => (
            <SelectItem key={person.nic} value={person.nic}>
              {person.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="Amount (e.g., 5000)"
        value={amount===0 ? '' : amount}
        onChange={(e) => setAmount(
          parseFloat(e.target.value) || 0
        )}
      />
      <Input
        placeholder="Expense Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Input
        placeholder="Vendor / Service Provider"
        value={vendor}
        onChange={(e) => setVendor(e.target.value)}
      />
      <Input
        type="date"
        value={paymentDate}
        onChange={(e) => setPaymentDate(e.target.value)}
      />
      <Textarea
        placeholder="Reason / Justification"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
       <Button onClick={enhanceUsingGemini}>
              {'Enhance using Gemini'}
            </Button>

      {isReady && (
        <PDFDownloadLink
          document={
            <PDFDoc
              expender={expender}
              amount={amount}
              description={description}
              vendor={vendor}
              paymentDate={paymentDate}
              reason={reason}
            />
          }
          fileName="Joint_Expense_Approval.pdf"
        >
          {({ loading }) => (
            <>
            <Button disabled={loading}>
              {loading ? 'Generating PDF...' : 'Download PDF'}
            </Button>
            </>          
          )}
          
        </PDFDownloadLink>
      )}
    </div>
  );
}
