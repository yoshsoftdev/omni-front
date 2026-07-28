export type SnippetLanguage =
  | "curl"
  | "javascript"
  | "node_fetch"
  | "go"
  | "php"
  | "python"
  | "csharp"
  | "java";

export const SNIPPET_LANGUAGES: Array<{ id: SnippetLanguage; label: string }> = [
  { id: "curl", label: "cURL" },
  { id: "javascript", label: "JavaScript" },
  { id: "node_fetch", label: "Node Fetch" },
  { id: "go", label: "Go" },
  { id: "php", label: "PHP" },
  { id: "python", label: "Python" },
  { id: "csharp", label: "C#" },
  { id: "java", label: "Java" },
];

export function generateSnippet(opts: {
  language: SnippetLanguage;
  url: string;
  body: Record<string, unknown>;
}): string {
  const { language, url, body } = opts;
  const json = JSON.stringify(body, null, 2);
  const compact = JSON.stringify(body);

  switch (language) {
    case "curl":
      return `curl -X POST '${url}' \\
  -H 'Authorization: Bearer oc_auto_YOUR_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '${compact}'`;
    case "javascript":
      return `const res = await fetch('${url}', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer oc_auto_YOUR_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(${json}),
});
const data = await res.json();
console.log(data);`;
    case "node_fetch":
      return `import fetch from 'node-fetch';

const res = await fetch('${url}', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer oc_auto_YOUR_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(${json}),
});
console.log(await res.json());`;
    case "go":
      return `package main

import (
  "bytes"
  "fmt"
  "net/http"
)

func main() {
  body := []byte(\`${compact}\`)
  req, _ := http.NewRequest("POST", "${url}", bytes.NewBuffer(body))
  req.Header.Set("Authorization", "Bearer oc_auto_YOUR_KEY")
  req.Header.Set("Content-Type", "application/json")
  res, err := http.DefaultClient.Do(req)
  if err != nil { panic(err) }
  defer res.Body.Close()
  fmt.Println(res.Status)
}`;
    case "php":
      return `<?php
$ch = curl_init('${url}');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    'Authorization: Bearer oc_auto_YOUR_KEY',
    'Content-Type: application/json',
  ],
  CURLOPT_POSTFIELDS => '${compact}',
  CURLOPT_RETURNTRANSFER => true,
]);
echo curl_exec($ch);
curl_close($ch);`;
    case "python":
      return `import requests

res = requests.post(
    "${url}",
    headers={
        "Authorization": "Bearer oc_auto_YOUR_KEY",
        "Content-Type": "application/json",
    },
    json=${json},
)
print(res.json())`;
    case "csharp":
      return `using System.Net.Http;
using System.Text;

var client = new HttpClient();
var content = new StringContent(@"${compact.replace(/"/g, '""')}", Encoding.UTF8, "application/json");
client.DefaultRequestHeaders.Add("Authorization", "Bearer oc_auto_YOUR_KEY");
var res = await client.PostAsync("${url}", content);
Console.WriteLine(await res.Content.ReadAsStringAsync());`;
    case "java":
      return `HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("${url}"))
    .header("Authorization", "Bearer oc_auto_YOUR_KEY")
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString("${compact.replace(/"/g, '\\"')}"))
    .build();
HttpResponse<String> res = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(res.body());`;
    default:
      return compact;
  }
}
