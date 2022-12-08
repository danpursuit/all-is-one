# all-is-one (alpha)
AI1 is an all-inclusive user interface for AI image generation with procedural experiment capabilities. A project that I am committed to in my spare time. Open source under the Apache 2.0 license.

## Standard Features
- txt2img
- img2img
- work in progress, will be adding standard features such as face restoration, inpainting, upscaling, as well as newer features such as eDiffi's segmentation maps

## Features
- Procedural Submit allows you to send variations of any parameter/multiple parameters and see what all the generations would look like in a single batch
<img src="sample/d1_circled.jpg" alt="sample1" title="sample1" width="600" height="375" />

- In-house image browser lets you view past generations, as well as view/reuse the same parameters used, including the initial image (img2img), prompt, negative prompt, etc.

<p float="left">
<img src="sample/d2_circled.JPG" alt="sample2" title="sample2" width="250" height="156" />
<img src="sample/d3_circled.JPG" alt="sample3" title="sample3" width="250" height="156" />
<img src="sample/d4_circled.JPG" alt="sample4" title="sample4" width="250" height="156" />
</p>

- Model Manager lets you download diffusers models and convert .ckpt files straight from your UI
<img src="sample/model_manager.jpg" alt="models" title="models" width="600" height="268" />

- Support for inpainting and outpainting

<img src="sample/inpainting_work.jpg" alt="inpainting" title="inpainting" width="250" height="232" />

<p float="left">
<img src="sample/inpainting_res.jpg" alt="Inpainting Result" title="Inpainting Result" width="300" height="120" />
<img src="sample/outpainting_res.jpg" alt="Outpainting Result" title="Outpainting Result" width="300" height="120" />
</p>

- Undo Redo functionality
- Tips and Prompt Help buttons to assist new users


## Installation:
- cd all-is-one/server
    - for now, server/ is the working folder (sorry)
- conda env create -n ai1 --file environment.yaml
- conda activate ai1
- get token from https://huggingface.co/settings/tokens
- create .env file in the server/ folder with "HF_TOKEN=[your_token]"
- ~~python setup.py~~ (no longer needed, go to Select Model in the UI to download/convert models)
- python server.py
    - leave this running in the background
- go to http://localhost:5050/
    - Done!
    - The first run will take you to the "Select Model" tab, where you can download models from HuggingFace or convert .ckpt files
