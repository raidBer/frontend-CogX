import * as signalR from "@microsoft/signalr";

export function createHubConnection(hubPath: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5139";
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${baseUrl}${hubPath}`, {
      skipNegotiation: false,
      transport:
        signalR.HttpTransportType.ServerSentEvents |
        signalR.HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();

  return connection;
}

export { signalR };
