# BitCANN
BitCANN - **Bitcoin Cash for Assigned Names and Numbers** – is a decentralized domain name and identity system built on the Bitcoin Cash Blockchain.

- Decentralized Domain Names like `.sat` and `.bch` and more.
- Add Records, RPA Pay Codes, Add Currency Addresses, Text Records, Custom Records, Social, Email, and more.
- No Renewals or Expiry*
- NFT Domain ownership, enabling secondary market trading.
- Easy lookups
- Sign-In using your Identity
- Earn by protecting the system by:
   - Burning illegal registration attempts
   - Identifying and burning registration conflicts
   - Proving domain violations

## Table of Contents
1. [Contracts](#contracts)
   - [Registry](#registry)
   - [Operational Contracts](#operational-contracts)
      - [Auction](#auction)
      - [Bid](#bid)
      - [DomainFactory](#domainfactory)
   - [Guard Contracts](#guard-contracts)
      - [AuctionNameEnforcer](#auctionnameenforcer)
      - [DomainOwnershipGuard](#domainownershipguard)
      - [AuctionConflictResolver](#auctionconflictresolver)
   - [Domain](#3-domain)
   - [Accumulator](#accumulator)
2. [Cashtokens](#cashtokens)
   - [RegistrationNFTs](#registrationnfts)
   - [AuctionNFT](#auctionnft)
   - [AuthorizedThreadNFTs](#authorizedthreadnfts)
   - [DomainNFTs](#domainnfts)
3. [FAQs](#faqs)
   - [How are domains sold?](#how-are-domains-sold)
   - [Who earns from the auction sales?](#who-earns-from-the-auction-sales)
   - [How is the correctness of the name verified?](#how-is-the-correctness-of-the-name-verified)
   - [How are auctions created?](#how-are-auctions-created)
   - [What if two auctions for the same name are running?](#what-if-two-auctions-for-the-same-name-are-running)
   - [I won the bidding contest, how do I claim the domain?](#i-won-the-bidding-contest-how-do-i-claim-the-domain)
   - [Why Internal Auth NFT and External Auth NFT in each Domain Contract?](#why-internal-auth-nft-and-external-auth-nft-in-each-domain-contract)
   - [What if the tokenAmount in the CounterNFT runs out?](#what-if-the-tokenamount-in-the-counternft-runs-out)
   - [An illegal registration auction has started for a domain that is owned by someone, will there be two owners?](#an-illegal-registration-auction-has-started-for-a-domain-that-is-owned-by-someone-will-there-be-two-owners)
   - [Can a bid be cancelled?](#can-a-bid-be-cancelled)
   - [Can anyone renounce ownership of a domain?](#can-anyone-renounce-ownership-of-a-domain)
   - [What happens to the ownershipNFT when the ownership is renounced or the domain is abandoned?](#what-happens-to-the-ownershipnft-when-the-ownership-is-renounced-or-the-domain-is-abandoned)
   - [How do domain or record lookups work?](#how-do-domain-or-record-lookups-work)
   - [How does ownership transfer work?](#how-does-ownership-transfer-work)
   - [How to add records?](#how-to-add-records)
   - [How to remove records?](#how-to-remove-records)
   - [No Renewal or Expiry?](#no-renewal-or-expiry)

## Contracts

The architecture is built around a series of smart contracts, categorized into these main types:

- **Registry Contract**: [Registry.cash](#registry)

- **Operational Contracts**: [Auction.cash](#auction), [Bid.cash](#bid), [DomainFactory.cash](#domainfactory)

- **Guard Contracts**: [AuctionNameEnforcer.cash](#auctionnameenforcer), [DomainOwnershipGuard.cash](#domainownershipguard), [AuctionConflictResolver.cash](#auctionconflictresolver)

- **Domain Contract**: [Domain.cash](#3-domain)

- **Accumulator Contract**: [Accumulator.cash](#accumulator)


### Registry

The Registry contract functions as the control and storage hub. Operational, Guard, and Accumulator contracts must execute their transactions in conjunction with the Registry contract.
This contract holds [RegistrationNFTs](#registrationnfts), [AuctionNFTs](#auctionnft), and [AuthorizedThreadNFTs](#authorizedthreadnfts).


Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | [AuthorizedThreadNFT](#authorizedthreadnfts) NFT with authorized contract's locking bytecode as commitment from self | [AuthorizedThreadNFT](#authorizedthreadnfts) back to self + (optionally tokenAmount from auctionNFT input) |
| 1 | Any UTXO from Authorized contract | UTXO back to Authorized contract |

Note: The actual number and structure of inputs/outputs and covenants beyond this pair is controlled by the authorized contract being used.

### Operational Contracts

#### Auction

The Auction contract lets anyone start a new auction.
Each auction requires:
   - A minimum starting bid of at least 0.025 BCH
   - It must run for at least a day, (the timer resets with a new bid)

Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | [AuthorizedThreadNFT](#authorizedthreadnfts) NFT with authorized contract's locking bytecode as commitment from [Registry Contract](#registry) | [AuthorizedThreadNFT](#authorizedthreadnfts) back to [Registry Contract](#registry) |
| 1 | Any UTXO from self | Back to self |
| 2 | [RegistrationNFTs](#registrationnfts) Counter NFT | [RegistrationNFTs](#registrationnfts) Counter NFT, with nftCommitment incremented by 1 and tokenAmount decreased by NewRegistrationID |
| 3 | Funding UTXO from bidder | [AuctionNFT](#auctionnft) |
| 4 | | OP_RETURN revealing the name |
| 5 | | Optional change in BCH |


#### Bid

The bid contract allows anyone to bid on an active auction by allowing restricted manipulation of auctionNFT. It updates the `satoshisValue` and the `pkh` in the `nftCommitment`. The only condition is that the new Bid amount must be at least 5% higher.

Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | [AuthorizedThreadNFT](#authorizedthreadnfts) NFT with authorized contract's locking bytecode as commitment from [Registry Contract](#registry) | [AuthorizedThreadNFT](#authorizedthreadnfts) back to [Registry Contract](#registry) |
| 1 | Any UTXO from Authorized contract | UTXO back to Authorized contract |
| 2 | [AuctionNFT](#auctionnft) | [AuctionNFT](#auctionnft) with increased amount and updated commitment |
| 3 | Funding UTXO from new bidder | Previous bid amount returned to previous bidder |
| 4 | | Optional change to new bidder |


#### DomainFactory

The DomainFactory burns the auctionNFT and issues 3 new NFTs [DomainNFTs](#domainnfts). It verifies that the actionNFT input is at least 1 day old. It also attaches the tokenAmount from auctionNFT to the authorized contract's thread.

Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | [AuthorizedThreadNFT](#authorizedthreadnfts) NFT with authorized contract's locking bytecode as commitment from [Registry Contract](#registry) | [AuthorizedThreadNFT](#authorizedthreadnfts) back to [Registry Contract](#registry) + tokenAmount from auctionNFT input|
| 1 | Any UTXO from self | Back to self |
| 2 | [RegistrationNFT](#registrationnfts) Domain Minting NFT | [RegistrationNFT](#registrationnfts) Domain Minting NFT back to registry contract |
| 3 | [AuctionNFT](#auctionnft) | [DomainNFT](#domainnfts) External Auth NFT |
| 4 | | [DomainNFT](#domainnfts) Internal Auth NFT |
| 5 | | [DomainNFT](#domainnfts) Ownership NFT|
| 6 | | Platform fee and rest to miners |


### Guard Contracts

These contracts serve the purpose of incentivizing the enforcement of the rules. For example, if someone were to start a registration for a domain that is already owned then the [DomainOwnershipGuard](#domainownershipguard) contract will authorize anyone to provide proof of ownership of the domain using [External Auth DomainNFT](#domainnfts) and penalize the illegal auction by burning the auctionNFT and giving the funds to the proof provider.

Similarly, other contracts also provide a way to authorize anyone to penalize anyone who attempts to break the rules of the system


#### AuctionNameEnforcer

The AuctionNameEnforcer contract allows anyone to prove that the running auction has an invalid domain name. By providing proof (index of the invalid character) they burn the auctionNFT, taking away the entire amount as a reward.

Rules: 
- The name must consist of only these characters
   - Letters (a-z or A-Z)
   - Numbers (0-9)
   - Hyphens (-)

Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | [AuthorizedThreadNFT](#authorizedthreadnfts) NFT with authorized contract's locking bytecode as commitment from [Registry Contract](#registry) | [AuthorizedThreadNFT](#authorizedthreadnfts) back to [Registry Contract](#registry) + tokenAmount from auctionNFT input|
| 1 | Any UTXO from self | Back to self |
| 2 | [AuctionNFT](#auctionnft) | Reward output |


#### DomainOwnershipGuard

This prevents registrations for domains that have already been registered and have owners. Anyone can provide proof of valid ownership([External Auth DomainNFT](#domainnfts)) and burn the auctionNFT and claim the funds as a reward.

Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | [AuthorizedThreadNFT](#authorizedthreadnfts) NFT with authorized contract's locking bytecode as commitment from [Registry Contract](#registry) | [AuthorizedThreadNFT](#authorizedthreadnfts) back to [Registry Contract](#registry) + tokenAmount from auctionNFT input|
| 1 | Any UTXO from self | Back to self |
| 2 | [DomainNFT](#domainnfts) External Auth NFT | [DomainNFT](#domainnfts) External Auth NFT back to the Domain Contract |
| 2 | [AuctionNFT](#auctionnft) | Reward output |


#### AuctionConflictResolver

If two registration auctions exist for the same domain name, the one with the higher registrationID i.e the tokenAmount is invalid. (Since registration is a single-threaded operation such scenarios are unlikely to occur willingly.)
> **Important**: Applications must verify the presence of auctionNFTs in the registry contract before permitting any new registrations. Due to BCH's UTXO-based system, there is no 'Contract Storage' to confirm the existence of an ongoing auction and transaction cannot fail.

This contract allows anyone to prove that an auction is invalid and burn the invalid auctionNFT in the process and taking away the funds as a reward for keeping the system in check.

Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | [AuthorizedThreadNFT](#authorizedthreadnfts) NFT with authorized contract's locking bytecode as commitment from [Registry Contract](#registry) | [AuthorizedThreadNFT](#authorizedthreadnfts) back to [Registry Contract](#registry) + tokenAmount from auctionNFT input|
| 1 | Any UTXO from self | Back to self |
| 2 | Valid [AuctionNFT](#auctionnft) |  Valid [AuctionNFT](#auctionnft) back to Registry Contract |
| 3 | Invalid [AuctionNFT](#auctionnft) | Reward output |

### Domain

The Domain contract allows the owner to perform a few operations after [DomainNFTs](#domainnfts) are issued from [DomainFactory](#domainfactory). There exists a unique domain contract for each unique domain name.

There are 3 functions in each Domain Contract:
- **addRecord**: This allows the owner of the domain to add records.

Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | [DomainNFTs](#domainnfts) Internal Auth NFT from self | [DomainNFTs](#domainnfts) Internal Auth NFT returned to self |
| 1 | [DomainNFTs](#domainnfts) Domain ownership NFT from owner | [DomainNFTs](#domainnfts) Domain ownership NFT returned to owner |
| 2 | Funding UTXO (Can come from anywhere) | OP_RETURN containing record data or removal hash |
| 3 |  | BCH change output |

- **externalUse**: This can be called by anyone to prove that the domain is owned.

Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| x | UTXO from self | Back to self |

- **burn**: This allows the owner of the domain to renounce ownership OR if the domain has been inactive for > 2 years then anyone can burn the domain allowing for a new auction.

Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | [DomainNFTs](#domainnfts) Internal Auth NFT | BCH change output |
| 1 | [DomainNFTs](#domainnfts) External Auth NFT | |
| 2 | Pure BCH or [DomainNFTs](#domainnfts) Domain ownership NFT from owner | |


### Accumulator

Once enough auctions have happened, there might come a time when the counterNFT's tokenAmount is not enough. Since the amount would be accumulating in the thread NFTs, this function can be used to transfer them back to the CounterNFT to keep the system functioning smoothly.

Transaction Structure:
| # | Inputs | Outputs |
|---|--------|---------|
| 0 | [AuthorizedThreadNFT](#authorizedthreadnfts) NFT with authorized contract's locking bytecode as commitment from [Registry Contract](#registry) | [AuthorizedThreadNFT](#authorizedthreadnfts) back to [Registry Contract](#registry) |
| 1 | Any UTXO from self | Back to self |
| 2 | [RegistrationNFTs](#registrationnfts) Counter NFT | [RegistrationNFTs](#registrationnfts) Counter NFT with tokenAmount from input3 |
| 2 | [AuthorizedThreadNFT](#authorizedthreadnfts) Authorized contract's UTXO with tokenAmount | [AuthorizedThreadNFT](#authorizedthreadnfts) without tokenAmount back to [Registry Contract](#registry) |
| 4 | Pure BCH | Change BCH |

---

### Cashtokens

The contracts talk to each other through cashtokens. There are 4 types in this system:
- [RegistrationNFTs](#registrationnfts)
- [AuctionNFT](#auctionnft)
- [AuthorizedThreadNFTs](#authorizedthreadnfts)
- [DomainNFTs](#domainnfts)

#### RegistrationNFTs
A pair of minting NFTs that reside within the [Registry.cash](#registry) contract, consisting of:
   - **CounterNFT**: A minting hybrid NFT has nftCommitment that starts from 0 and increments by 1 with each new registration. It is also initialized with the maximum possible token amount of `9223372036854775807` that interacts with [Auction.cash](#auction) to facilitate the creation of new auction NFTs. Based on the value of the new registrationID the new minted AuctionNFT gets the exact tokenAmount. [FAQ](#what-if-the-tokenamount-in-the-counternft-runs-out)
      - `category`: domainCategory
      - `commitment`: registrationID < 8 bytes >
      - `tokenAmount`: Keeps reducing with each new registration.
   - **DomainMintingNFT**: A minting NFT that works with [DomainFactory.cash](#domainfactory) to issue new Domain NFTs. This has no nftCommitment or tokenAmount.
      - `category`: domainCategory

#### AuctionNFT
A mutable hybrid NFT created for each new auction that remains within [Registry.cash](#registry), containing comprehensive auction information through the following attributes:
   - `nftCommitment`: A combination of `bidderPKH< 20 bytes > + name < bytes >`
   - `tokenAmount`: This represents the registrationID
   - `capability`: Mutable
   - `satoshis`: The latest bid amount
   - `category`: The designated domainCategory
   A new bid simply updates the pkh in the nftCommitment and updates the satoshi value to the new amount.

#### AuthorizedThreadNFTs
Each authorized contract's lockingbytecode(Excluding [Domain.cash](#3-domain)) is added to an immutable NFT commitment. These immutable NFTs stay with `Registry.cash`. Any interaction with the registry must include one of these thread NFTs to create a transaction.
   - `category`: domainCategory
   - `commitment`: lockingbytecode <35 bytes>

The Registry Contract has a designated number of threads for authorized contracts:
- Auction: ~5 threads
- Bid: ~5 threads
- DomainFactory: ~5 threads
- AuctionNameEnforcer: ~5 threads
- DomainOwnershipGuard: ~5 threads
- AuctionConflictResolver: ~5 threads
- Accumulator: 1 thread

#### DomainNFTs
A set of three immutable NFTs minted when an auction ends:
   - **OwnershipNFT**: This NFT proves ownership of a specific domain.
      - `category`: domainCategory
      - `commitment`: registrationID < 8 bytes > + name < bytes >

   - **InternalAuthNFT**: A specialized authorization NFT that resides within the Domain contract and must be used together with the OwnershipNFT to enable the owner's interaction with [Domain.cash](#3-domain).
      - `category`: domainCategory
      - `commitment`: registrationID < 8 bytes >

   - **ExternalAuthNFT**: A specialized authorization NFT that resides within the Domain Contract but can be attached to any transaction, particularly utilized by [DomainOwnershipGuard.cash](#domainownershipguard) to prove existing domain ownership and enforce penalties on illegal auction attempts.
      - `category`: domainCategory

If the domain has been inactive for > 2 years then the domain is considered abandoned and anyone can prove the inactivity and burn the Internal and External Auth NFTs to make the auction of auction possible.


---

## FAQs

#### How are domains sold?
Domains are sold through an auction. The auction starts using the [Auction](#auction) Contract and is open for new Bids from anyone using the [Bid](#bid) contract. Once no new bids have been made for a day, the bidder can claim the domain by using the [DomainFactory](#domainfactory) contract.

#### Who earns from the auction sales?

Anyone can attach their own address to the platform fee. The percentage of the fee is set in the contract parameters of the [DomainFactory](#domainfactory) contract.

#### How is the correctness of the name verified?
Check [AuctionNameEnforcer](#auctionnameenforcer)

#### How are auctions created?
Check [Auction](#auction)

#### What if two auctions for the same name are running?
Check [AuctionConflictResolver](#auctionconflictresolver)

#### I won the bidding contest, how do I claim the domain?
Check [DomainFactory](#domainfactory)

#### Why Internal Auth NFT and External Auth NFT in each Domain Contract?
Check [DomainNFTs](#domainnfts)

#### What if the tokenAmount in the CounterNFT runs out?
As more and more registrations happen, the tokens get gathered up in the authorized contract threads. Anyone can accumulate the tokenAmounts from all these threads and send it to the counter NFT.

Registry Contract has a way to accumulate all the funds used up since the beginning.
Accumulation of tokens, When any process ends, either through guards or from domainfactory, the tokenAmount help in the auctionNFTs is sent to the active authorized thread NFT. Later these thread NFTs in combination with the CounterNFT can be used to send all the tokenAmounts back to the CounterNFT ensuring a continued registration process.

#### An auction has started for a domain that is owned by someone, will there be two owners?
Check [DomainOwnershipGuard](#domainownershipguard)

#### Can a bid be cancelled?
No, Once a bid is made, it's locked in.

#### Can anyone renounce ownership of a domain?
Yes, The owner must call the `renounceOwnership` function of their respective Domain contract.
The function will burn the Internal Auth NFT and the External Auth NFT allowing anyone to initiate a new auction for the domain.

#### What happens to the ownershipNFT when the ownership is renounced or the domain is abandoned?
Since the ownershipNFT's first 8 bytes are registrationID, they cannot influence the domain contract as the new internal Auth NFT will have a different registrationID. The existing ownershipNFT renders useless.

#### How do domain or record lookups work?
Domain lookups can be done in multiple ways:
- Find domain contract: Take name, calculate hash256, attach domain contract bytecode, hash to get address
- Find owner: Check who owns the domain NFT
- Find records: Get transaction history of domain contract and check OP_RETURN outputs

#### How does ownership transfer work? 
Ownership transfer is handled simply by transferring the domain NFT to the new owner. The NFT proves ownership rights to the domain.

#### How to add records?
Each DomainContract has a way to add records. The owner can add new records using the `addRecord` function of the DomainContract. Records are added as OP_RETURN outputs. Records can be found by checking transaction history

#### How to remove records?

[TBD] Since the records are OP_RETURN it's not possible to remove them. However, it's possible to provide a way that can act as a standard for libraries to understand. To 'remove' a Record a new transaction with OP_RETURN(RMV + hash) of record to remove can be created.

#### No Renewal or Expiry?
To ensure that the domains are not lost forever, the Owner must do at least 1 activity (Add or Remove records) using the domain in a span of 2 years. Once done, the cycle resets. So if the owner has not interacted with the domain for > 2 years then the system assumes that it's abandoned and allows for re-auction