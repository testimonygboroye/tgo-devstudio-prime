import { getReadReceiptSummary } from "../readReceipts";

describe("conversation read receipts", () => {
  const members = [
    { _id: "owner", name: "Owner" },
    { _id: "one", name: "Alex" },
    { _id: "two", name: "Jordan" },
    { _id: "three", name: "Sam" },
  ];
  it("shows Seen for a direct message after the other participant reads it", () => {
    expect(getReadReceiptSummary(["owner", "one"], "owner", "owner", members.slice(0, 2), "direct"))
      .toEqual({ label: "Seen", title: "Alex" });
  });
  it("shows the group read count and reader names without treating the sender as a reader", () => {
    expect(getReadReceiptSummary(["owner", "one", "two"], "owner", "owner", members, "group"))
      .toEqual({ label: "Seen by 2/3", title: "Alex, Jordan" });
  });
  it("does not show a read receipt to a message recipient or before anyone else reads", () => {
    expect(getReadReceiptSummary(["owner"], "owner", "owner", members, "direct")).toBeNull();
    expect(getReadReceiptSummary(["owner", "one"], "owner", "one", members, "direct")).toBeNull();
  });
});
