import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ExtractionDetail() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:8000/extractions/${id}`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        toast({ title: "Failed to load", variant: "destructive" });
        setLoading(false);
      });
  }, [id, toast]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!data) return <div className="p-8 text-center">Extraction not found.</div>;

  const renderConfidenceBadge = (conf: string) => {
    let color = "bg-gray-500";
    if (conf === "high") color = "bg-green-500";
    if (conf === "medium") color = "bg-yellow-500";
    if (conf === "low") color = "bg-red-500";
    
    return <Badge className={`${color} text-white uppercase text-xs ml-2`}>{conf}</Badge>;
  };

  const renderField = (key: string, fieldObj: any) => {
    // If it's a list of fields (like line items or skills)
    if (Array.isArray(fieldObj)) {
      return (
        <div key={key} className="mb-4">
          <p className="font-semibold capitalize text-gray-700">{key.replace("_", " ")}</p>
          <div className="ml-4 space-y-2 mt-2">
            {fieldObj.map((item, idx) => (
              <div key={idx} className="bg-gray-50 p-2 rounded border">
                {item.value ? item.value : <span className="text-gray-400 italic">No value ({item.note})</span>}
                {item.confidence && renderConfidenceBadge(item.confidence)}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Normal field
    return (
      <div key={key} className="mb-4 pb-2 border-b">
        <p className="font-semibold capitalize text-gray-700 mb-1">{key.replace("_", " ")}</p>
        <p className="text-lg">
          {fieldObj.value ? fieldObj.value : <span className="text-gray-400 italic">No value extracted {fieldObj.note ? `- ${fieldObj.note}` : ''}</span>}
          {fieldObj.confidence && renderConfidenceBadge(fieldObj.confidence)}
        </p>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Upload
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Result: {data.filename}</span>
            <Badge variant="outline">{data.document_type}</Badge>
          </CardTitle>
          <p className="text-sm text-gray-500">Processed on {new Date(data.timestamp).toLocaleString()}</p>
        </CardHeader>
        <CardContent>
          <div className="mt-4">
            {Object.keys(data.data).map(key => renderField(key, data.data[key]))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
