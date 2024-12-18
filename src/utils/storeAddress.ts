import { beginCell } from "@ton/core";

export const storeAddresses = (addresses: any[]) => {
  let allCount = addresses.length;
  let refs = [];
  let cells = [];
  let currentCell = beginCell();
  let currentRef = beginCell();

  for (let i = 0; i < addresses.length; i++) {
    let currentCount = i + 1;
    const address = addresses[i].address;
    const amount = addresses[i].amount;
    currentCell.storeUint(amount, 64).storeAddress(address);
    if (currentCount === allCount) {
      currentCell.endCell();
      cells.push(currentCell);
    }
    else if (currentCount % 3 === 0) {
      currentCell.endCell();
      cells.push(currentCell);
      currentCell = beginCell();
    }
  }

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    currentRef.storeRef(cell);
    if ((i + 1) % 3 === 0) {
      refs.unshift(currentRef);
      currentRef = beginCell();
    } else if (i === cells.length - 1) {
      refs.unshift(currentRef);
    }
  }

  let current = refs[0].endCell();
  for (let i = 0; i < refs.length - 1; i++) {
    let nextRef = refs[i + 1];
    nextRef.storeRef(current);
    current = nextRef.endCell();
  }

  const commentCell = beginCell()
    .storeBit(1)
    .storeRef(
      beginCell()
        .storeUint(0, 32)               // 预留32位用于标识
        .storeStringTail('你好啊')       // 存储评论内容
        .endCell(),
    )
    .endCell();

  let topCurrentCell = beginCell()
    .storeUint(allCount, 64)
    .storeRef(current)
    .storeMaybeRef(commentCell)
    .endCell();

  return topCurrentCell;

};