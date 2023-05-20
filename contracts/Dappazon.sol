// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Dappazon {
    string public name;
    address public owner;

    struct Item {
        uint256 id;
        string name;
        string category;
        string image;
        uint256 price;
        uint256 rating;
        uint256 stock;
    }

    struct Order {
        uint256 time;
        Item item;
    }

    mapping(uint256 => Item) public items;
    mapping(address => uint256) public orderCount;
    mapping(address => mapping(uint256 => Order)) public orders;

    event List(string name, uint256 price, uint256 quantity);
    event Buy(address buyer, uint256 orderId, uint256 itemId);

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    constructor() {
        name = "Blockazon";
        owner = msg.sender;
    }

    // List Products

    function list(
        uint256 _id,
        string memory _name,
        string memory _category,
        string memory _image,
        uint256 _price,
        uint256 _rating,
        uint256 _stock
    ) public onlyOwner {
        // Create item struct
        Item memory item = Item(
            _id,
            _name,
            _category,
            _image,
            _price,
            _rating,
            _stock
        );

        // Save struct to the blockchain
        items[_id] = item;

        // Emit an event
        emit List(_name, _price, _stock);
    }

    // Buy Products
    function buy(uint256 _id) public payable {
        // Fetch Item
        Item memory item = items[_id];

        // Require enough ether to buy an item
        require(msg.value >= item.price);

        // Require item in stock
        require(item.stock > 0);

        // Create an Order
        Order memory order = Order(block.timestamp, item);

        // Save order to chain
        orderCount[msg.sender] = orderCount[msg.sender] + 1;
        orders[msg.sender][orderCount[msg.sender]] = order;

        // Subtract stock
        items[_id].stock = item.stock - 1;

        // Emit event
        emit Buy(msg.sender, orderCount[msg.sender], item.id);
    }

    // Withdraw Funds
    function withdraw() public onlyOwner {
        (bool success, ) = owner.call{value : address(this).balance}("");
        require(success);
    }
}
