const Registry = require('./contracts/Registry');
const Auction = require('./contracts/Auction');
const Bid = require('./contracts/Bid');
const Domain = require('./contracts/Domain');
const DomainFactory = require('./contracts/DomainFactory');
const AuctionConflictResolver = require('./contracts/AuctionConflictResolver');
const AuctionNameEnforcer = require('./contracts/AuctionNameEnforcer');
const DomainOwnershipGuard = require('./contracts/DomainOwnershipGuard');
const Accumulator = require('./contracts/Accumulator');

const BitCANNArtifacts = {
	Registry,
	Auction,
	Bid,
	Domain,
	DomainFactory,
	AuctionConflictResolver,
	AuctionNameEnforcer,
	DomainOwnershipGuard,
	Accumulator,
};

module.exports = {
	BitCANNArtifacts,
};
