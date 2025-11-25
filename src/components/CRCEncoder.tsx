import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

// CRC-4 polynomial: G(z) = z^4 + z + 1 (binary: 10011)
const POLYNOMIAL = 0b10011;
const CRC_WIDTH = 4;

interface EncodingStep {
  step: number;
  data: string;
  register: string;
  operation: string;
}

export const CRCEncoder = () => {
  const [inputData, setInputData] = useState("1010");
  const [encodedData, setEncodedData] = useState("");
  const [crcBits, setCrcBits] = useState("");
  const [steps, setSteps] = useState<EncodingStep[]>([]);
  const [testData, setTestData] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const calculateCRC = (data: string): { crc: string; steps: EncodingStep[] } => {
    const calculationSteps: EncodingStep[] = [];
    const bits = data + "0000"; // Append 4 zeros for CRC-4
    let register = 0;
    
    for (let i = 0; i < bits.length; i++) {
      const bit = parseInt(bits[i]);
      register = (register << 1) | bit;
      
      const registerBinary = register.toString(2).padStart(5, "0");
      calculationSteps.push({
        step: i + 1,
        data: bits.substring(0, i + 1),
        register: registerBinary,
        operation: register & 0b10000 ? "XOR with polynomial" : "Shift left"
      });
      
      if (register & 0b10000) {
        register ^= POLYNOMIAL;
      }
    }
    
    const crc = (register & 0b1111).toString(2).padStart(CRC_WIDTH, "0");
    return { crc, steps: calculationSteps };
  };

  const handleEncode = () => {
    if (!/^[01]+$/.test(inputData)) {
      return;
    }
    
    const { crc, steps: calculationSteps } = calculateCRC(inputData);
    setCrcBits(crc);
    setEncodedData(inputData + crc);
    setSteps(calculationSteps);
    setIsValid(null);
  };

  const handleVerify = () => {
    if (!/^[01]+$/.test(testData) || testData.length < CRC_WIDTH) {
      return;
    }
    
    const dataWithoutCRC = testData.slice(0, -CRC_WIDTH);
    const receivedCRC = testData.slice(-CRC_WIDTH);
    const { crc: calculatedCRC } = calculateCRC(dataWithoutCRC);
    
    setIsValid(receivedCRC === calculatedCRC);
  };

  const handleReset = () => {
    setInputData("1010");
    setEncodedData("");
    setCrcBits("");
    setSteps([]);
    setTestData("");
    setIsValid(null);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-3">
            <Calculator className="w-10 h-10 text-primary" />
            CRC-4 Encoder & Decoder
          </h1>
          <p className="text-muted-foreground text-lg">
            Interactive Cyclic Redundancy Check Calculator
          </p>
          <div className="inline-block">
            <Badge variant="outline" className="text-base py-1 px-4 font-mono">
              G(z) = z⁴ + z + 1
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Encoder Section */}
          <Card>
            <CardHeader>
              <CardTitle>Encoder</CardTitle>
              <CardDescription>Enter binary data to calculate CRC-4 checksum</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Input Data (Binary)</label>
                <div className="flex gap-2">
                  <Input
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value.replace(/[^01]/g, ""))}
                    placeholder="1010"
                    className="font-mono text-lg"
                    maxLength={16}
                  />
                  <Button onClick={handleEncode} className="gap-2">
                    <Calculator className="w-4 h-4" />
                    Encode
                  </Button>
                </div>
              </div>

              {encodedData && (
                <div className="space-y-3 p-4 bg-muted rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Original Data:</p>
                    <p className="font-mono text-xl font-bold text-foreground">{inputData}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">CRC Bits:</p>
                    <p className="font-mono text-xl font-bold text-accent">{crcBits}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Encoded Data:</p>
                    <p className="font-mono text-xl font-bold text-primary">
                      {inputData}
                      <span className="text-accent">{crcBits}</span>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Decoder Section */}
          <Card>
            <CardHeader>
              <CardTitle>Decoder</CardTitle>
              <CardDescription>Verify encoded data and detect errors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Encoded Data (Binary)</label>
                <div className="flex gap-2">
                  <Input
                    value={testData}
                    onChange={(e) => setTestData(e.target.value.replace(/[^01]/g, ""))}
                    placeholder="10101011"
                    className="font-mono text-lg"
                    maxLength={20}
                  />
                  <Button onClick={handleVerify} variant="secondary" className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Verify
                  </Button>
                </div>
              </div>

              {isValid !== null && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                  isValid 
                    ? "bg-success/10 border border-success/20" 
                    : "bg-destructive/10 border border-destructive/20"
                }`}>
                  {isValid ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-success" />
                      <div>
                        <p className="font-semibold text-success">Valid Data</p>
                        <p className="text-sm text-muted-foreground">No errors detected</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-6 h-6 text-destructive" />
                      <div>
                        <p className="font-semibold text-destructive">Error Detected</p>
                        <p className="text-sm text-muted-foreground">CRC check failed</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              <Button onClick={handleReset} variant="outline" className="w-full gap-2">
                <RefreshCw className="w-4 h-4" />
                Reset
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Calculation Steps */}
        {steps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Calculation Steps</CardTitle>
              <CardDescription>Step-by-step CRC calculation process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-semibold">Step</th>
                      <th className="text-left py-2 px-4 font-semibold">Data Processed</th>
                      <th className="text-left py-2 px-4 font-semibold">Register State</th>
                      <th className="text-left py-2 px-4 font-semibold">Operation</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {steps.map((step, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-2 px-4">{step.step}</td>
                        <td className="py-2 px-4 text-primary">{step.data}</td>
                        <td className="py-2 px-4 text-accent">{step.register}</td>
                        <td className="py-2 px-4 text-sm text-muted-foreground">{step.operation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>About CRC-4</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              CRC (Cyclic Redundancy Check) is an error-detecting code commonly used in digital networks
              and storage devices to detect accidental changes to raw data.
            </p>
            <p>
              This implementation uses the polynomial <strong className="text-foreground font-mono">G(z) = z⁴ + z + 1</strong>,
              which in binary is represented as <strong className="text-foreground font-mono">10011</strong>.
            </p>
            <p>
              The encoder appends 4 CRC bits to your data, and the decoder can verify if the data was
              transmitted correctly by recalculating the CRC and comparing it.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
