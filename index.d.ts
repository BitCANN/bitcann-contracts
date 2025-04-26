import { Artifact } from 'cashscript'

declare interface BitCANNArtifacts
{
	'Accumulator': Artifact,
	'Auction': Artifact,
	'AuctionConflictResolver': Artifact,
	'AuctionNameEnforcer': Artifact,
	'Bid': Artifact,
	'Domain': Artifact,
	'DomainFactory': Artifact,
	'DomainOwnershipGuard': Artifact,
	'Registry': Artifact
}

declare const _exports:
{
	BitCANNArtifacts: BitCANNArtifacts,
};

export = _exports;
