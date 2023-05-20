const { expect } = require("chai");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

// Global constants for listing an item
const ID = 1;
const NAME = "Shoes";
const CATEGORY = "Clothing";
const IMAGE = "";
const PRICE = tokens("1");
const RATING = 4;
const STOCK = 5;

describe("Dappazon", () => {
  let dappazon;
  let deployer, buyer;

  beforeEach(async () => {
    // Setup Accounts
    [deployer, buyer] = await ethers.getSigners();
    //console.log(deployer.address, buyer.address);

    // Deploy Contract
    const Dappazon = await ethers.getContractFactory("Dappazon");
    dappazon = await Dappazon.deploy();
  });

  describe("Deployment", () => {
    it("Sets the owner", async () => {
      expect(await dappazon.owner()).to.equal(deployer.address);
    });

    it("Has a name", async () => {
      const Dappazon = await ethers.getContractFactory("Dappazon");
      dappazon = await Dappazon.deploy();
      expect(await dappazon.name()).to.equal("Blockazon");
    });
  });

  describe("Listing", () => {
    let transaction;

    beforeEach(async () => {
      transaction = await dappazon
        .connect(deployer)
        .list(ID, NAME, CATEGORY, IMAGE, PRICE, RATING, STOCK);
      await transaction.wait();
    });
    it("Returns item attributes", async () => {
      const item = await dappazon.items(ID);
      expect(item.id).to.equal(ID);
      expect(item.name).to.equal(NAME);
      expect(item.category).to.equal(CATEGORY);
      expect(item.image).to.equal(IMAGE);
      expect(item.price).to.equal(PRICE);
      expect(item.rating).to.equal(RATING);
      expect(item.stock).to.equal(STOCK);
    });

    it("Emits List event", () => {
      expect(transaction).to.emit(dappazon, "List");
    });
  });

  describe("Buying", () => {
    let transaction;

    beforeEach(async () => {
      // List an item

      transaction = await dappazon
        .connect(deployer)
        .list(ID, NAME, CATEGORY, IMAGE, PRICE, RATING, STOCK);
      await transaction.wait();

      // Buy an item

      transaction = await dappazon.connect(buyer).buy(ID, { value: PRICE });
    });

    it("Updates buyer's order count", async () => {
      const result = await dappazon.orderCount(buyer.address);
      expect(result).to.equal(1);
    });
    it("Adds the order", async () => {
      const order = await dappazon.orders(buyer.address, 1);

      expect(order.time).to.be.greaterThan(0);
      expect(order.item.name).to.equal(NAME);
    });

    it("Updates the Contract Balance", async () => {
      const result = await ethers.provider.getBalance(dappazon.address);
      expect(result).to.equal(PRICE);
    });

    it("Emits Buy event", async () => {
      expect(transaction).to.emit(dappazon, "Buy");
    });
  });

  describe("Withdrawing", () => {
    let balanceBefore;

    beforeEach(async () => {
      // List an item
      let transaction = await dappazon
        .connect(deployer)
        .list(ID, NAME, CATEGORY, IMAGE, PRICE, RATING, STOCK);
      await transaction.wait();
      // Buy an item
      transaction = await dappazon.connect(buyer).buy(ID, { value: PRICE });
      await transaction.wait();
      // Withdraw
      balanceBefore = await ethers.provider.getBalance(deployer.address);
      transaction = await dappazon.connect(deployer).withdraw();
      await transaction.wait();
    });

    it("Updates the owner balance", async () => {
      const balanceAfter = await ethers.provider.getBalance(deployer.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Updates the contract balance", async () => {
      const balanceAfter = await ethers.provider.getBalance(dappazon.address);
      expect(balanceAfter).to.equal(0);
    });
  });
});
