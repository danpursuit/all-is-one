// for more tokens:
// https://moritz.pm/posts/parameters
// https://danbooru.donmai.us/wiki_pages/tag_groups
// https://docs.google.com/document/d/1SaQx1uJ9LBRS7c6OsZIaeanJGkUdsUBjk9X4dC59BaA/edit

const styles = [
    'digital painting',
    'digital art',
    'digital',
    'anime',
    'painting',
    'illustration',
    'movie poster',
    'book cover',
    'manga cover',
    'comic book cover',
    'cartoon',
    'photo',
    'portrait',
].sort();

const shot_types = [
    'establishing shot',
    'medium wide shot',
    'medium shot',
    'medium close up',
    'close up',
    'extreme close up',
    'low angle shot',
    'high angle shot',
    'over the shoulder shot',
    'two shot',
    'dutch angle',
    'aerial shot',
    'birds eye shot',
]

const photography = [
    "analog photo", "polaroid", "macro photography", "overglaze", "volumetric fog", "depth of field (or dof)", "silhouette", "motion lines", "motion blur", "fisheye", "ultra-wide angle"
].sort()

const environment = [
    "stunning environment", "wide-angle", "aerial view", "landscape painting", "aerial photography", "massive scale", "street level view", "landscape", "panoramic", "lush vegetation", "idyllic", "overhead shot"
].sort()

const details = [
    "wallpaper", "poster", "sharp focus", "hyperrealism", "insanely detailed", "lush detail", "filigree", "intricate", "crystalline", "perfectionism", "max detail", "4k uhd", "spirals", "tendrils", "ornate", "HQ", "angelic", "decorations", "embellishments", "masterpiece", "hard edge", "breathtaking", "embroidery"
].sort()

const lighting = [
    "bloom", "god rays", "hard shadows", "studio lighting", "soft lighting", "diffused lighting", "rim lighting", "volumetric lighting", "specular lighting", "cinematic lighting", "luminescence", "translucency", "subsurface scattering", "global illumination", "indirect light", "radiant light rays", "bioluminescent details", "ektachrome", "glowing", "shimmering light", "halo", "iridescent", "backlighting", "caustics"
].sort()

const effects = ['80s', '90s', '2000s', '2010s', '2020s', 'abstract', 'unreal engine', 'trending on artstation', 'trending on deviantart', 'polaroid', 'vintage', 'professional photograph', 'canon m50', "vibrant", "muted colors", "vivid color", "post-processing", "colorgrading", "tone mapping", "lush", "low contrast", "vintage", "aesthetic", "psychedelic", "monochrome"
].sort();
const effects2D = ["color page", "halftone", "character design", "concept art", "symmetry", "pixiv fanbox", "trending on dribbble", "precise lineart", "tarot card"]

const prompt_rituals = [
    'realistic',
    'realistic photo',
    'realistic anatomy',
    'realistic portrait',
    'masterpiece',
    'highres',
    'detailed',
    '8k',
    'intricate',
    'sharp colors',
    'soft focus',
    'vivid'
].sort()

const negative_rituals = ['lowres', 'bad anatomy', 'bad hands', 'text', 'error', 'missing fingers', 'mutated hands', 'extra digit', 'fewer digits', 'cropped', 'worst qualilty', 'low quality', 'normal quality', 'jpeg artifacts', 'signature', 'watermark', 'username', 'blurry', 'mutilated', 'out of frame', 'fused fingers', 'cartoon', 'anime', 'grainy', 'ugly', 'pixelated', 'long neck', 'poorly drawn face', 'gross proportions', 'disfigured', 'bad proportions', 'big ears',
].sort()

const spellOf2D = ['digital art, digital painting, trending on artstation, golden ratio, evocative, award winning, shiny, smooth, surreal, divine, celestial, elegant, oil painting (helps improve multiple styles), soft, fascinating, fine art, official art, keyvisual']
const spellOf3D = ['unreal engine, octane render, bokeh, vray, houdini render, quixel megascans, arnold render, 8k uhd, raytracing, cgi, lumen reflections, cgsociety, ultra realistic, 100mm, film photography, dslr, cinema4d, studio quality, film grain']
const spellOfWatermark = ['caption, watermark, text, artifacts']
const spellOfPortrait = ['lowres, text, error, cropped, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, out of frame, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck']
const spellOfElysium = ['lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry']

const convertList = (list) => {
    // first remove duplicates
    list = [...new Set(list)]
    return list.map((label) => {
        return {
            label: label,
            callback: null
        }
    })
}

export default {
    label: 'Prompt Help',
    items: [
        { label: 'Image Types', items: convertList(styles) },
        {
            label: 'Effects', items: [
                { label: '2D', items: convertList(effects2D) },
                ...convertList(effects)]
        },
        {
            label: 'Photography', items: [
                { label: 'Shot Types', items: convertList(shot_types) },
                ...convertList(photography),
            ]
        },
        { label: 'Environment', items: convertList(environment) },
        { label: 'Details', items: convertList(details) },
        { label: 'Lighting', items: convertList(lighting) },
        {
            label: 'Charms',
            items: [
                { label: 'Prompt', items: convertList(prompt_rituals) },
                { label: 'Negative Prompt', items: convertList(negative_rituals) },
            ]
        },
        {
            label: 'Black Magic',
            items: [
                { label: '3D', items: convertList(spellOf3D) },
                { label: '2D', items: convertList(spellOf2D) },
                { label: 'Remove Watermarks (negative)', items: convertList(spellOfWatermark) },
                { label: 'Better Portrait (negative)', items: convertList(spellOfPortrait) },
                { label: 'Elysium-type model (negative)', items: convertList(spellOfElysium) },
            ]
        }
    ]
}