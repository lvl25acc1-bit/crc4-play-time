import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calculator, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface CRCPolynomial {
  name: string;
  polynomial: number;
  width: number;
  binaryStr: string;
  formula: string;
}

const CRC_POLYNOMIALS: Record<string, CRCPolynomial> = {
  "CRC-4": {
    name: "CRC-4",
    polynomial: 0b10011,
    width: 4,
    binaryStr: "10011",
    formula: "z⁴ + z + 1"
  },
  "CRC-5-ITU": {
    name: "CRC-5-ITU",
    polynomial: 0b100101,
    width: 5,
    binaryStr: "100101",
    formula: "z⁵ + z² + 1"
  },
  "CRC-7": {
    name: "CRC-7",
    polynomial: 0b10001001,
    width: 7,
    binaryStr: "10001001",
    formula: "z⁷ + z³ + 1"
  },
  "CRC-8": {
    name: "CRC-8",
    polynomial: 0b100000111,
    width: 8,
    binaryStr: "100000111",
    formula: "z⁸ + z² + z + 1"
  }
};

export const ProblemSolver = () => {
  const [selectedCRC, setSelectedCRC] = useState<string>("CRC-4");
  const [inputFormat, setInputFormat] = useState<"binary" | "hex">("hex");
  const [hexInput, setHexInput] = useState("B1D");
  const [binaryInput, setBinaryInput] = useState("");
  const [encodedResult, setEncodedResult] = useState("");
  const [crcBits, setCrcBits] = useState("");
  
  // Error injection
  const [receivedData, setReceivedData] = useState("");
  const [errorPositions, setErrorPositions] = useState("");
  const [corruptedData, setCorruptedData] = useState("");
  const [verificationResult, setVerificationResult] = useState<string>("");
  
  // Error vector generation
  const [errorVector, setErrorVector] = useState("");
  const [undetectableError, setUndetectableError] = useState(false);

  const hexToBinary = (hex: string): string => {
    return parseInt(hex, 16).toString(2).padStart(hex.length * 4, "0");
  };

  const binaryToHex = (binary: string): string => {
    return parseInt(binary, 2).toString(16).toUpperCase();
  };

  const calculateCRC = (data: string, polynomial: number, width: number): string => {
    const bits = data + "0".repeat(width);
    let register = 0;
    
    for (let i = 0; i < bits.length; i++) {
      const bit = parseInt(bits[i]);
      register = (register << 1) | bit;
      
      if (register & (1 << width)) {
        register ^= polynomial;
      }
    }
    
    return (register & ((1 << width) - 1)).toString(2).padStart(width, "0");
  };

  const verifyCRC = (dataWithCRC: string, polynomial: number, width: number): { isValid: boolean; remainder: string } => {
    let register = 0;
    
    for (let i = 0; i < dataWithCRC.length; i++) {
      const bit = parseInt(dataWithCRC[i]);
      register = (register << 1) | bit;
      
      if (register & (1 << width)) {
        register ^= polynomial;
      }
    }
    
    const remainder = (register & ((1 << width) - 1)).toString(2).padStart(width, "0");
    return {
      isValid: remainder === "0".repeat(width),
      remainder
    };
  };

  const handleEncode = () => {
    const crcConfig = CRC_POLYNOMIALS[selectedCRC];
    let binaryData = "";
    
    if (inputFormat === "hex") {
      if (!/^[0-9A-Fa-f]+$/.test(hexInput)) {
        toast.error("Invalid hex input");
        return;
      }
      binaryData = hexToBinary(hexInput);
    } else {
      if (!/^[01]+$/.test(binaryInput)) {
        toast.error("Invalid binary input");
        return;
      }
      binaryData = binaryInput;
    }
    
    const crc = calculateCRC(binaryData, crcConfig.polynomial, crcConfig.width);
    const encoded = binaryData + crc;
    
    setCrcBits(crc);
    setEncodedResult(encoded);
    setReceivedData(encoded);
    
    toast.success("Data encoded successfully!");
  };

  const handleInjectError = () => {
    if (!encodedResult) {
      toast.error("Please encode data first");
      return;
    }
    
    const positions = errorPositions.split(",").map(p => parseInt(p.trim())).filter(p => !isNaN(p));
    if (positions.length === 0) {
      toast.error("Please enter valid bit positions (e.g., 2,3,4)");
      return;
    }
    
    let corruptedBits = encodedResult.split("");
    positions.forEach(pos => {
      if (pos >= 0 && pos < corruptedBits.length) {
        corruptedBits[pos] = corruptedBits[pos] === "0" ? "1" : "0";
      }
    });
    
    const corrupted = corruptedBits.join("");
    setCorruptedData(corrupted);
    
    const crcConfig = CRC_POLYNOMIALS[selectedCRC];
    const { isValid, remainder } = verifyCRC(corrupted, crcConfig.polynomial, crcConfig.width);
    
    setVerificationResult(`Remainder: ${remainder} (${binaryToHex(remainder)}h) - ${isValid ? "Valid" : "Error detected!"}`);
    
    toast.info("Error injected");
  };

  const handleGenerateErrorVector = () => {
    const crcConfig = CRC_POLYNOMIALS[selectedCRC];
    
    // Generate an error vector that's a multiple of the polynomial
    // This creates an undetectable error
    const polynomial = crcConfig.polynomial;
    const width = crcConfig.width;
    
    // Create a simple undetectable error: the polynomial itself shifted
    const errorBits = polynomial.toString(2).padStart(width + 1, "0") + "0".repeat(3);
    setErrorVector(errorBits);
    
    // Test if this error would be undetectable
    const { isValid } = verifyCRC(errorBits, polynomial, width);
    setUndetectableError(isValid);
    
    toast.success("Error vector generated");
  };

  const crcConfig = CRC_POLYNOMIALS[selectedCRC];

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Problem Solver Mode
          </CardTitle>
          <CardDescription>
            Solve CRC exercises step-by-step with different polynomials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CRC Polynomial</Label>
              <Select value={selectedCRC} onValueChange={setSelectedCRC}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(CRC_POLYNOMIALS).map(key => (
                    <SelectItem key={key} value={key}>
                      {key} - {CRC_POLYNOMIALS[key].formula}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2 flex-wrap mt-2">
                <Badge variant="outline" className="font-mono text-xs">
                  Binary: {crcConfig.binaryStr}
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  Width: {crcConfig.width} bits
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Input Format</Label>
              <Select value={inputFormat} onValueChange={(v) => setInputFormat(v as "binary" | "hex")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hex">Hexadecimal</SelectItem>
                  <SelectItem value="binary">Binary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="encoding" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="encoding">Task 1: Encoding</TabsTrigger>
          <TabsTrigger value="errors">Task 2: Error Detection</TabsTrigger>
          <TabsTrigger value="hardware">Task 3: Hardware</TabsTrigger>
        </TabsList>

        <TabsContent value="encoding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aufgabe 1: Codierung und Decodierung</CardTitle>
              <CardDescription>Encode data and calculate CRC checksum</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  {inputFormat === "hex" ? "Data (Hexadecimal)" : "Data (Binary)"}
                </Label>
                <div className="flex gap-2">
                  {inputFormat === "hex" ? (
                    <Input
                      value={hexInput}
                      onChange={(e) => setHexInput(e.target.value.toUpperCase())}
                      placeholder="B1D"
                      className="font-mono text-lg"
                    />
                  ) : (
                    <Input
                      value={binaryInput}
                      onChange={(e) => setBinaryInput(e.target.value.replace(/[^01]/g, ""))}
                      placeholder="101100011101"
                      className="font-mono text-lg"
                    />
                  )}
                  <Button onClick={handleEncode}>
                    <Calculator className="w-4 h-4 mr-2" />
                    Encode
                  </Button>
                </div>
              </div>

              {encodedResult && (
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Original Data:</Label>
                    <p className="font-mono text-lg">
                      Binary: {inputFormat === "hex" ? hexToBinary(hexInput) : binaryInput}
                    </p>
                    <p className="font-mono text-lg">
                      Hex: {inputFormat === "hex" ? hexInput : binaryToHex(binaryInput)}h
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">CRC Checksum ({crcConfig.width} bits):</Label>
                    <p className="font-mono text-lg text-accent">
                      Binary: {crcBits}
                    </p>
                    <p className="font-mono text-lg text-accent">
                      Hex: {binaryToHex(crcBits)}h
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Encoded Codeword (c):</Label>
                    <p className="font-mono text-lg text-primary">
                      Binary: {encodedResult}
                    </p>
                    <p className="font-mono text-lg text-primary">
                      Hex: {binaryToHex(encodedResult)}h
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total length: {encodedResult.length} bits ({(inputFormat === "hex" ? hexToBinary(hexInput) : binaryInput).length} data + {crcConfig.width} CRC)
                    </p>
                  </div>

                  <div className="p-3 bg-success/10 border border-success/20 rounded flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-success">Verification (c): Correct Transmission</p>
                      <p className="text-muted-foreground">
                        When received correctly, CRC verification remainder = 0
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aufgabe 2: Fehlerhafte Übertragung</CardTitle>
              <CardDescription>Inject errors and analyze detection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Received Data (use encoded data or enter custom)</Label>
                  <Input
                    value={receivedData}
                    onChange={(e) => setReceivedData(e.target.value.replace(/[^01]/g, ""))}
                    placeholder="Encoded data will appear here"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    {receivedData && `Hex: ${binaryToHex(receivedData)}h`}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Error Positions (comma-separated, 0-indexed)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={errorPositions}
                      onChange={(e) => setErrorPositions(e.target.value)}
                      placeholder="e.g., 2,3,4 for burst error at bits 4,3,2"
                      className="font-mono"
                    />
                    <Button onClick={handleInjectError} variant="destructive">
                      <Zap className="w-4 h-4 mr-2" />
                      Inject Error
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Example: "2,3,4" flips bits at positions 2, 3, and 4 (burst error length 3)
                  </p>
                </div>
              </div>

              {corruptedData && (
                <div className="space-y-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">a) Corrupted Data (e):</Label>
                    <p className="font-mono text-lg">
                      Binary: {corruptedData}
                    </p>
                    <p className="font-mono text-lg">
                      Hex: {binaryToHex(corruptedData)}h
                    </p>
                  </div>

                  <div className="p-3 bg-destructive/10 rounded">
                    <p className="font-semibold text-destructive mb-1">Verification Result:</p>
                    <p className="font-mono text-sm">{verificationResult}</p>
                  </div>
                </div>
              )}

              <div className="border-t pt-4 space-y-4">
                <div>
                  <Label className="text-lg font-semibold">b) Generate Undetectable Error Vector</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Create error vector with isolated 1-bit errors that won't be detected
                  </p>
                  <Button onClick={handleGenerateErrorVector} variant="secondary">
                    Generate Error Vector
                  </Button>
                </div>

                {errorVector && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <Label>Generated Error Vector (ε):</Label>
                    <p className="font-mono text-lg">{errorVector}</p>
                    <p className="font-mono">Hex: {binaryToHex(errorVector)}h</p>
                    <div className={`p-3 rounded flex items-start gap-2 ${
                      undetectableError 
                        ? "bg-destructive/10 border border-destructive/20"
                        : "bg-success/10 border border-success/20"
                    }`}>
                      {undetectableError ? (
                        <>
                          <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                          <div className="text-sm">
                            <p className="font-semibold text-destructive">Undetectable Error</p>
                            <p className="text-muted-foreground">
                              This error pattern is a multiple of the polynomial and won't be detected!
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                          <div className="text-sm">
                            <p className="font-semibold text-success">Error Would Be Detected</p>
                          </div>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      c) Verify: Apply this error to encoded data and check if detected
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hardware">
          <Card>
            <CardHeader>
              <CardTitle>Aufgabe 3: Hardware Implementation</CardTitle>
              <CardDescription>Analyze hardware CRC implementation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <Label className="text-lg font-semibold">a) XOR Gate Comparison:</Label>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-background rounded">
                    <span className="font-mono">CRC-5-ITU (z⁵ + z² + 1)</span>
                    <Badge>2 XOR gates</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-background rounded">
                    <span className="font-mono">CRC-7 (z⁷ + z³ + 1)</span>
                    <Badge>2 XOR gates</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Both require 2 XOR gates. The number of XOR gates equals the number of "1" coefficients minus 1.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-lg font-semibold mb-3 block">b) Shift Register Diagram:</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  For {selectedCRC}: {crcConfig.width} D flip-flops with XOR gates at polynomial tap positions
                </p>
                <div className="bg-background p-4 rounded border-2 border-dashed border-border">
                  <p className="text-center text-muted-foreground">
                    Visual diagram: Shift register with {crcConfig.width} stages
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                    {Array.from({ length: crcConfig.width }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-12 h-12 border-2 border-primary rounded flex items-center justify-center font-mono text-sm">
                          D{i}
                        </div>
                        {i < crcConfig.width - 1 && (
                          <div className="text-muted-foreground">→</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    XOR feedback taps based on polynomial: {crcConfig.binaryStr}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-lg font-semibold mb-3 block">c) Check Bit Pattern:</Label>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    For pattern c = 134h = {hexToBinary("134")}
                  </p>
                  <Button 
                    onClick={() => {
                      const binary = hexToBinary("134");
                      const { remainder } = verifyCRC(binary, crcConfig.polynomial, crcConfig.width);
                      toast.success(`Remainder: ${remainder} (${binaryToHex(remainder)}h)`);
                    }}
                    variant="secondary"
                  >
                    Calculate Remainder
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
