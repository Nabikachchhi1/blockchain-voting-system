// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Candidate {
        string name;
        uint256 voteCount;
    }
    
    struct Voter {
        bool hasVoted;
        uint256 constituency;
        uint256 votedCandidate;
    }
    
    mapping(bytes32 => Voter) public voters;
    mapping(uint256 => Candidate[]) public candidatesByConstituency;
    mapping(uint256 => string[]) public constituencyNames;
    
    address public owner;
    uint256 public totalConstituencies = 4;
    
    event VoteCast(bytes32 indexed voterHash, uint256 constituency, uint256 candidateIndex, string candidateName);
    event VoterRegistered(bytes32 indexed voterHash, uint256 constituency);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        
        // Initialize constituencies and candidates
        // Jalna (0)
        candidatesByConstituency[0].push(Candidate("KALYAN VAIJINATHRAO KALE", 0));
        candidatesByConstituency[0].push(Candidate("DANVE RAOSAHEB DADARAO", 0));
        candidatesByConstituency[0].push(Candidate("MANGESH SANJAY SABLE", 0));
        constituencyNames[0] = ["KALYAN VAIJINATHRAO KALE", "DANVE RAOSAHEB DADARAO", "MANGESH SANJAY SABLE"];
        
        // Aurangabad (1)
        candidatesByConstituency[1].push(Candidate("BHUMARE SANDIPANRAO ASARAM", 0));
        candidatesByConstituency[1].push(Candidate("IMTIAZ JALEEL SYED", 0));
        candidatesByConstituency[1].push(Candidate("CHANDRAKANT KHAIRE", 0));
        constituencyNames[1] = ["BHUMARE SANDIPANRAO ASARAM", "IMTIAZ JALEEL SYED", "CHANDRAKANT KHAIRE"];
        
        // Beed (2)
        candidatesByConstituency[2].push(Candidate("BAJRANG MANOHAR SONWANE", 0));
        candidatesByConstituency[2].push(Candidate("PANKAJA GOPINATHRAO MUNDE", 0));
        candidatesByConstituency[2].push(Candidate("ASHOK BHAGOJI THORAT", 0));
        constituencyNames[2] = ["BAJRANG MANOHAR SONWANE", "PANKAJA GOPINATHRAO MUNDE", "ASHOK BHAGOJI THORAT"];
        
        // Ahmednagar (3)
        candidatesByConstituency[3].push(Candidate("NILESH DNYANDEV LANKE", 0));
        candidatesByConstituency[3].push(Candidate("DR. SUJAY RADHAKRISHNA VIKHEPATIL", 0));
        candidatesByConstituency[3].push(Candidate("ALEKAR GORAKH DASHRATH", 0));
        constituencyNames[3] = ["NILESH DNYANDEV LANKE", "DR. SUJAY RADHAKRISHNA VIKHEPATIL", "ALEKAR GORAKH DASHRATH"];
    }
    
    function registerVoter(bytes32 voterHash, uint256 constituency) public onlyOwner {
        require(constituency < totalConstituencies, "Invalid constituency");
        require(!voters[voterHash].hasVoted, "Voter already registered");
        
        voters[voterHash].constituency = constituency;
        voters[voterHash].hasVoted = false;
        
        emit VoterRegistered(voterHash, constituency);
    }
    
    function vote(uint256 constituency, uint256 candidateIndex) public {
        bytes32 voterHash = keccak256(abi.encodePacked(msg.sender, block.timestamp));
        _vote(voterHash, constituency, candidateIndex);
    }
    
    function vote(uint256 constituency, uint256 candidateIndex, bytes32 voterHash) public {
        _vote(voterHash, constituency, candidateIndex);
    }
    
    function _vote(bytes32 voterHash, uint256 constituency, uint256 candidateIndex) internal {
        require(constituency < totalConstituencies, "Invalid constituency");
        require(candidateIndex < candidatesByConstituency[constituency].length, "Invalid candidate");
        require(!voters[voterHash].hasVoted, "Already voted");
        
        // Mark voter as voted
        voters[voterHash].hasVoted = true;
        voters[voterHash].constituency = constituency;
        voters[voterHash].votedCandidate = candidateIndex;
        
        // Increment vote count
        candidatesByConstituency[constituency][candidateIndex].voteCount++;
        
        emit VoteCast(
            voterHash, 
            constituency, 
            candidateIndex, 
            candidatesByConstituency[constituency][candidateIndex].name
        );
    }
    
    function getResultsFor(uint256 constituency) public view returns (uint256[] memory) {
        require(constituency < totalConstituencies, "Invalid constituency");
        
        uint256 candidateCount = candidatesByConstituency[constituency].length;
        uint256[] memory results = new uint256[](candidateCount);
        
        for (uint256 i = 0; i < candidateCount; i++) {
            results[i] = candidatesByConstituency[constituency][i].voteCount;
        }
        
        return results;
    }
    
    function getCandidates(uint256 constituency) public view returns (string[] memory) {
        require(constituency < totalConstituencies, "Invalid constituency");
        return constituencyNames[constituency];
    }
    
    function hasVoted(bytes32 voterHash) public view returns (bool) {
        return voters[voterHash].hasVoted;
    }
    
    function getVoterInfo(bytes32 voterHash) public view returns (bool hasVotedStatus, uint256 constituency, uint256 votedCandidate) {
        Voter memory voter = voters[voterHash];
        return (voter.hasVoted, voter.constituency, voter.votedCandidate);
    }
    
    function getTotalVotes() public view returns (uint256) {
        uint256 total = 0;
        for (uint256 c = 0; c < totalConstituencies; c++) {
            for (uint256 i = 0; i < candidatesByConstituency[c].length; i++) {
                total += candidatesByConstituency[c][i].voteCount;
            }
        }
        return total;
    }
}
