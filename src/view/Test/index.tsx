import {
  CHAIN,
  THEME,
  TonConnectButton,
  useTonAddress,
  useTonConnectUI,
} from "@tonconnect/ui-react";
import { useEffect, useState } from "react";
import { shortenAddress } from "../../utils";
import { Box, Button, Switch, TextField } from "@mui/material";
import { toast } from "react-hot-toast";

import { Address, beginCell, toNano } from "@ton/ton";
import WebApp from "@twa-dev/sdk";
import { storeAddresses } from "../../utils/storeAddress";

const Test = () => {
  const [refreshBalance, setRefreshBalance] = useState<boolean>(false);
  const [walletAddressReceiver, setWalletAddressReceiver] =
    useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isSendJetton, setIsSendJetton] = useState<boolean>(false);
  const [jettonAddress, setJettonAddress] = useState<string>("");
  const [sendMessage, setSendMessage] = useState<string>("");

  const [ref, setRef] = useState<string | null>(null);

  const walletAddress = useTonAddress();
  const [tonConnectUI, setOption] = useTonConnectUI();

  useEffect(() => {
    if (WebApp.initDataUnsafe) {
      const encodeInitData = decodeURIComponent(WebApp.initData);

      const params = new URLSearchParams(encodeInitData);

      const ref = params.get("start_param");
      console.log("ref: ", ref);
      setRef(ref);
    }
  }, []);

  const getWalletBalance = async (address: string) => {
    try {
      const response = await fetch(
        `https://toncenter.com/api/v2/jsonRPC=${address || walletAddress}`
      );

      const data = await response.json();
      console.log("data::", data);
      if (data.ok) {
        setWalletBalance(Number(data.result.balance) / 1e9);
      }
    } catch (error) {
      console.log("getWalletBalance error", error);
    }
  };

  const onSendToken = async () => {
    // const amountSend = Number(2);
    // if (!walletAddressReceiver || !amount || amountSend <= 0) {
    //   toast.error("Invalid address or amount");
    //   return;
    // }

    try {
      // Send Jetton token
      if (isSendJetton) {
        // const destinationAddress = Address.parse(walletAddressReceiver);
        const jettonWalletContract = Address.parse(jettonAddress);

        // const isSendUsdt =
        //   jettonAddress === "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs";

        // const forwardPayload = beginCell()
        //   .storeUint(0, 32) // 0 opcode means we have a comment
        //   .storeStringTail(sendMessage)
        //   .endCell();
        const addresses = [];

        addresses.push({
          amount: BigInt(1 * 1e6),
          address: Address.parse(
            "UQAEkuTlMIIt9BogjOCjXyOydYArSH6mS8fuzt0ivpzIP_xS"
          ),
        });

        addresses.push({
          amount: BigInt(1 * 1e6),
          address: Address.parse(
            "UQAEkuTlMIIt9BogjOCjXyOydYArSH6mS8fuzt0ivpzIP_xS"
          ),
        });
        const forwardPayload = storeAddresses(addresses);

        const body = beginCell()
          .storeUint(0xf8a7ea5, 32) // opcode for jetton transfer
          .storeUint(0, 64) // query id
          .storeCoins(toNano(2 / 1000)) // jetton amount, amount * 10^9 , USDT ???
          .storeAddress(
            Address.parse("EQCrHA0m-bavVhcu9PjvVO3EOvgNKU92cNfyhtT863NrG-N1")
          ) // TON wallet destination address
          .storeAddress(Address.parse(walletAddress)) // response excess destination
          .storeBit(0) // no custom payload
          .storeCoins(2 * 0.07 * 1e9) // forward amount (if >0, will send notification message)
          .storeBit(1) // we store forwardPayload as a reference
          .storeRef(forwardPayload)
          .endCell();

        const myTransaction = {
          validUntil: Math.floor(Date.now() / 1000) + 360,
          messages: [
            {
              address: jettonWalletContract.toString(), // sender jetton wallet
              amount: toNano(1).toString(), // for commission fees, excess will be returned
              payload: body.toBoc().toString("base64"), // payload with jetton transfer and comment body
            },
          ],
        };

        const txBoc = await tonConnectUI.sendTransaction(myTransaction);
        if (txBoc.boc) {
          setJettonAddress("");
          setRefreshBalance((pre) => !pre);
          setAmount("");
          setWalletAddressReceiver("");
          setSendMessage("");
        }

        return;
        // end of send jetton token
      }

      // const messageBody = beginCell()
      //   .storeUint(0, 32) // Opcode for comment (0 is typically used for plain text)
      //   .storeStringTail(sendMessage) // Your custom message
      //   .endCell();
      // Send TONtoken
      // const myTransaction = {
      //   validUntil: Math.floor(Date.now() / 1000) + 60,
      //   messages: [
      //     {
      //       address: walletAddressReceiver,
      //       amount: (1 * 1e9).toString(),
      //       payload: messageBody?.toBoc()?.toString("base64"),
      //     },
      //   ],
      //   network: CHAIN.TESTNET, // make it on testnet
      // };

      // const txBoc = await tonConnectUI.sendTransaction(myTransaction);

      // if (txBoc.boc) {
      //   setRefreshBalance((pre) => !pre);
      //   setAmount("0");
      //   setWalletAddressReceiver("");
      //   setSendMessage("");
      // }
    } catch (error) {
      console.log("onSendToken error", error);
    }
  };

  useEffect(() => {
    tonConnectUI.connector.onStatusChange((walletInfo) => {
      if (!walletInfo) {
        setWalletBalance(0);
        setAmount("");
        setWalletAddressReceiver("");
        setSendMessage("");
      }
    });
  }, []);

  useEffect(() => {
    walletAddress && getWalletBalance(walletAddress);
  }, [walletAddress, refreshBalance]);

  useEffect(() => {
    setOption({
      uiPreferences: {
        theme: THEME.LIGHT,
      },
    });
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      {<p>{ref ? `Your ref: ${ref}` : "No ref"}</p>}
      <TonConnectButton />
      <p>Wallet address: {shortenAddress(walletAddress)}</p>
      <p>Wallet balance: {walletBalance} TON</p>

      {/* SEND TRANSACTION */}

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Switch onChange={(e) => setIsSendJetton(e.target.checked)} />
          <p>Send Jetton token</p>
        </Box>
        {isSendJetton && (
          <TextField
            placeholder="Jetton address..."
            onChange={(e) => setJettonAddress(e.target.value)}
            size="small"
            value={jettonAddress}
            label="Jetton address"
          />
        )}

        <TextField
          placeholder="Address..."
          onChange={(e) => setWalletAddressReceiver(e.target.value)}
          size="small"
          value={walletAddressReceiver}
          label="Recipe Address"
        />
        <TextField
          placeholder="Amount..."
          onChange={(e) => setAmount(e.target.value)}
          size="small"
          value={amount}
          label="Amount"
        />
        <TextField
          placeholder="Message..."
          onChange={(e) => setSendMessage(e.target.value)}
          size="small"
          value={sendMessage}
          label="Message"
        />

        <Button onClick={onSendToken} variant="contained">
          Send token
        </Button>
      </div>
    </div>
  );
};

export default Test;
