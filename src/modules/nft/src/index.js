import configs from './config';
import API from './api';
import NftCollection from './nftCollection';

// const endPointUrl = 'https://localhost:3000/local'

export default class Nft {
  constructor(environment = {}) {
    this.active = true;
    this.network = environment.network || { type: { name: 'ETH' } };
    this.activeAddress = environment.address;
    this.tokenSetUpdateHook = environment.tokenSetUpdateHook;
    this.setAvailableContracts = environment.setAvailableContracts;
    this.web3 = environment.web3;
    this.nftUrl = `${configs.url}getImage`;
    this.openSeaLambdaUrl = configs.url;
    this.nftConfig = {};
    this.selectedContract = '';
    this.detailsFor = {};
    this.ownedTokenBasicDetails = [];

    this.api = new API({
      url: this.openSeaLambdaUrl,
      address: this.activeAddress
    });
  }

  static async init(environment) {
    const create = new Nft(environment);
    await create.setup();
    return create;
  }

  //======================================================================
  setSelectedContract(selectedContract) {
    this.selectedContract = selectedContract;
  }

  getOwnedTokenBasicDetails() {
    return this.ownedTokenBasicDetails;
  }

  hasImage(nft) {
    if (nft.customNft || nft.image === '') {
      return true;
    }
    if (nft.loaded) {
      return true;
    }
  }

  async setup() {
    const nftData = {};
    let selectedContract;
    if (this.network.type.name === 'ETH') {
      const configData = await this.api.getTokens();
      if (!configData.error) {
        configData.tokenContracts.forEach(data => {
          this.ownedTokenBasicDetails.push({
            name: data.name,
            count: data.owned_asset_count,
            contract: data.contractIdAddress
          });
          nftData[data.contractIdAddress] = new NftCollection({
            details: data,
            api: this.api,
            address: this.activeAddress,
            tokenSetUpdateHook: this.tokenSetUpdateHook,
            web3: this.web3
          });
        });
        this.nftConfig = { ...nftData };
        selectedContract = Object.keys(this.nftConfig)[0];
        this.selectedContract = Object.keys(this.nftConfig)[0];
        this.setAvailableContracts(Object.keys(this.nftConfig));
        return selectedContract;
      }
    }
  }

  async getFirstTokenSet(selectedContract) {
    return new Promise(resolve => {
      this.nftConfig[selectedContract]
        .getNftDetails(selectedContract)
        .then(() => {
          this.nftConfig[selectedContract]
            .getNftDetails(selectedContract, 9, 18, true)
            .then(() => {
              resolve(this.nftConfig[selectedContract]);
            });
        });
    });
  }

  getNext() {
    return this.nftConfig[this.selectedContract].getNext();
  }
  getPrevious() {
    return this.nftConfig[this.selectedContract].getPrevious();
  }
}