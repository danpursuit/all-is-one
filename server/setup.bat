::this file is incomplete for now
::it's more a list of commands that I've used
conda create --name all-is-one
conda activate all-is-one
conda install pip
conda install pytorch torchvision torchaudio cudatoolkit=11.6 -c pytorch -c conda-forge
pip install -r requirements.txt

conda env create --name self-stable --file environment.yaml
conda env update --name self-stable --file environment.yaml

conda install -c conda-forge diffusers

python scripts/sd_to_diffusers.py --checkpoint_path models/model.ckpt --scheduler_type ddim --dump_path models/diffusion_ddim.bin
python scripts/sd_to_diffusers.py --checkpoint_path models/model.ckpt --original_config_file models/v1-inference.yaml --scheduler_type ddim --dump_path models/diffusion_ddim.bin

::go to https://huggingface.co/CompVis/stable-diffusion-v1-4 and agree to terms
::then create token and put in .env
