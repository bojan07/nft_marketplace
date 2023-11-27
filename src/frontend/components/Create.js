import { useState } from 'react'
import { ethers } from "ethers"
import { Row, Form, Button } from 'react-bootstrap'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import FormData from 'form-data'
import axios from 'axios'
const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

const Create = ({ marketplace, nft }) => {
  const [image, setImage] = useState('')
  const [price, setPrice] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const uploadToIPFS = async (event) => {
    event.preventDefault()
    const file = event.target.files[0]
    const ipfsUploadUrl = 'https://api.pinata.cloud/pinning/pinFileToIPFS'

    if (typeof file !== 'undefined') {
      try {
        const form = new FormData()
        form.append('file', file)

        let config = {
          method: 'post',
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          url: `${ipfsUploadUrl}`,
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_PINATA_JWT_SECRET}`,
          },
          data: form
        }

        await axios(config)
          .then((ipfsResponse) => {
            setImage(`https://pink-wrong-herring-463.mypinata.cloud/ipfs/${ipfsResponse?.data?.IpfsHash}`)
          })
          .catch((e) => {
            console.log('error: ', e.message);
          })

      } catch (error){
        console.log("ipfs image upload error: ", error)
      }
    }
  }
  const createNFT = async () => {
    if (!image || !price || !name || !description) return

    const ipfsUploadUrl = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'

    try{
      let config = {
        method: 'post',
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        url: `${ipfsUploadUrl}`,
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_PINATA_JWT_SECRET}`,
        },
        data: JSON.stringify({image, price, name, description})
      }

      await axios(config)
        .then((ipfsResponse) => {
          mintThenList(ipfsResponse.data)
        })
        .catch((e) => {
          console.log('error: ', e.message);
        })
    } catch(error) {
      console.log("ipfs uri upload error: ", error)
    }
  }
  const mintThenList = async (result) => {
    const uri = `https://pink-wrong-herring-463.mypinata.cloud/ipfs/${result.IpfsHash}`
    // mint nft 
    await(await nft.mint(uri)).wait()
    // get tokenId of new nft 
    const id = await nft.tokenCount()
    // approve marketplace to spend nft
    await(await nft.setApprovalForAll(marketplace.address, true)).wait()
    // add nft to marketplace
    const listingPrice = ethers.utils.parseEther(price.toString())
    await(await marketplace.makeItem(nft.address, id, listingPrice)).wait()
  }
  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            <Row className="g-4">
              <Form.Control
                type="file"
                required
                name="file"
                onChange={uploadToIPFS}
              />
              <Form.Control onChange={(e) => setName(e.target.value)} size="lg" required type="text" placeholder="Name" />
              <Form.Control onChange={(e) => setDescription(e.target.value)} size="lg" required as="textarea" placeholder="Description" />
              <Form.Control onChange={(e) => setPrice(e.target.value)} size="lg" required type="number" placeholder="Price in ETH" />
              <div className="d-grid px-0">
                <Button onClick={createNFT} variant="primary" size="lg">
                  Create & List NFT!
                </Button>
              </div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Create