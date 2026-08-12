import net from "node:net";
import tls from "node:tls";

function encodeAuth(value) {
  return Buffer.from(String(value), "utf8").toString("base64");
}

function readSmtpReply(socket) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const onData = (chunk) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter((line) => line.length > 0);
      if (!lines.length) return;
      const last = lines[lines.length - 1];
      if (/^\d{3} /.test(last)) {
        cleanup();
        resolve({ code: Number(last.slice(0, 3)), text: buffer });
      }
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    const onEnd = () => {
      cleanup();
      reject(new Error("SMTP connection closed before a reply."));
    };
    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("end", onEnd);
    };
    socket.on("data", onData);
    socket.on("error", onError);
    socket.on("end", onEnd);
  });
}

async function command(socket, line) {
  socket.write(`${line}\r\n`);
  const reply = await readSmtpReply(socket);
  if (reply.code >= 400) throw new Error(`SMTP ${reply.code}: ${reply.text.trim()}`);
  return reply;
}

/**
 * Minimal SMTP submitter (STARTTLS + AUTH LOGIN when credentials are present).
 * Used as the default `submit` for createSmtpEmailTransport when SMTP_HOST is set.
 */
export async function submitSmtpMessage({
  host,
  port = 587,
  user,
  password,
  from,
  to,
  subject,
  text,
}) {
  if (!host || !from || !to) {
    return { outcome: "failed", reason: "smtp_missing_fields", providerMessageId: null };
  }
  const portNumber = Number(port || 587);
  const useTls = portNumber === 465;
  const socket = useTls
    ? tls.connect({ host, port: portNumber, servername: host })
    : net.connect({ host, port: portNumber });
  try {
    await readSmtpReply(socket);
    await command(socket, `EHLO sachviet.local`);
    if (!useTls) {
      socket.write("STARTTLS\r\n");
      const start = await readSmtpReply(socket);
      if (start.code === 220) {
        await new Promise((resolve, reject) => {
          const upgraded = tls.connect({ socket, servername: host }, resolve);
          upgraded.once("error", reject);
        });
      }
      await command(socket, `EHLO sachviet.local`);
    }
    if (user && password) {
      await command(socket, "AUTH LOGIN");
      await command(socket, encodeAuth(user));
      await command(socket, encodeAuth(password));
    }
    await command(socket, `MAIL FROM:<${from}>`);
    await command(socket, `RCPT TO:<${to}>`);
    await command(socket, "DATA");
    const body = [`From: ${from}`, `To: ${to}`, `Subject: ${subject}`, "", text, "."].join("\r\n");
    socket.write(`${body}\r\n`);
    await readSmtpReply(socket);
    await command(socket, "QUIT");
    return { outcome: "sent", providerMessageId: null };
  } catch (error) {
    return {
      outcome: "failed",
      reason: error instanceof Error ? error.message.slice(0, 200) : "smtp_failed",
      providerMessageId: null,
    };
  } finally {
    socket.end();
  }
}
