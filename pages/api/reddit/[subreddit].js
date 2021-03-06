require('dotenv').config()
const Fetch = require("node-fetch");
const FormData = require("form-data");
const { reddit } = require("reddit.images");

const UploadFile = async (props) => {
    const response = await Fetch(props.url);
    const buffer = await response.buffer();
    const url = `https://uploads.slate.host/api/public/${props.collection}`;

    let data = new FormData();
    data.append("data", buffer, { filename: `${props.screen_name}-reddit.${props.file_type}` });
    const upload = await Fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${props.api}`,
        },
        body: data
    });

    const json = await upload.json();

    let fileMeta = json.data;
    let profileLink = `https://reddit.com/user/${props.screen_name}`;

    fileMeta.data = {
        source: props.source,
        name: `${props.screen_name} r/${props.subreddit}`,
        body: props.description,
        author: profileLink
    };

    const responseMeta = await Fetch('https://slate.host/api/v2/update-file', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${props.api}`,
        },
        body: JSON.stringify({ data: fileMeta }),
    });
    
    return fileMeta;
};

export default function handler(req, res) {
    const { query: { subreddit, api, collection }} = req;

    if (!subreddit) {
        return res.status(200).json({ error: 'No subreddit provided' })
    }

    if (!api) {
        return res.status(200).json({ error: 'No api key provided' })
    }

    if (!collection) {
        return res.status(200).json({ error: 'No collection id provided' })
    }

    reddit.FetchSubredditPost(subreddit, "hot").then(async (data) => {

        console.log(data)

        if(data.image.endsWith("jpg") || data.image.endsWith("jpeg") || data.image.endsWith("png") || data.image.endsWith("gif")) {
            var fileType = data.image.substr(data.image.length - 3);

            let upload = await UploadFile({
                url: data.image,
                source: data.postLink,
                created_at: data.createdUtc,
                screen_name: data.author,
                description: data.title,
                subreddit: subreddit,
                file_type: fileType,
                api: api,
                collection: collection,
            });

            return res.status(200).json({ data: upload })
        }

            return res.status(200).json({ error: "No image in post" })
        
    });
};