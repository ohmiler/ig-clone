import React, {useState} from 'react'
import { Button, Input } from "@material-ui/core";
import '../css/PostUpload.css'
import { db, storage, auth } from '../firebase/firebase';
import firebase from "firebase";

function PostUpload({ setNewPost }) {
    const username = auth.currentUser.displayName;
    const [progress, setProgress] = useState(0)
    const [file, setFile] = useState(null)
    const [caption, setCaption] = useState("")
    const chooseFile = (e) => {
        if (e.target.files[0]){
            setFile(e.target.files[0]);
        }
    }

    async function resizeMe(img) {
        var max_width = 500;
        var max_height = 500;

        var canvas = document.createElement('canvas');
        const bitmap = await createImageBitmap(img)
        var width = bitmap.width;
        var height = bitmap.height;

        // calculate the width and height, constraining the proportions
        if (width > height) {
          if (width > max_width) {
            //height *= max_width / width;
            // console.log(`Math.round(${height} *= ${max_width} / ${width}) ${Math.round(height *= max_width / width)}` )
            height = Math.round(height *= max_width / width);
            width = max_width;
          }
        } else {
          if (height > max_height) {
            //width *= max_height / height;
            width = Math.round(width *= max_height / height);
            // console.log(`Math.round(${width} *= ${max_height} / ${height}) ${Math.round(width *= max_height / height)}` )
            height = max_height;
          }
        }
        // resize the canvas and draw the image data into it
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(bitmap, 0, 0, width, height);
        var blobBin = atob(canvas.toDataURL("image/jpeg", 0.7).split(',')[1]);
        var array = [];
        for(var i = 0; i < blobBin.length; i++) {
            array.push(blobBin.charCodeAt(i));
        }
        var file = new Blob([new Uint8Array(array)], {type: 'image/png'});


        return file; // get the data from canvas as 70% JPG (can be also PNG, etc.)
      
    }
      
    const uploadFile = async () => {
        const imageName = file.name;
        const addPost = function(caption, username, url) {
            const newPost = {
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                caption: caption,
                username: username,
                imageURL: url
            }
            db.collection('posts').add(newPost).then((doc)=>{
                setNewPost({ post: newPost,
                             id: doc.id });
            }).catch(reason => console.error(reason))
        };
        
        const uploadTask = storage.ref(`images/${imageName}`).put( await resizeMe(file)) //need to unique
            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const progress = Math.round(
                        (snapshot.bytesTransferred/ snapshot.totalBytes)* 100
                    );
                    setProgress(progress);
                },
                (error) => {
                    console.log(error);
                    alert(error.message);
                },
                () => {
                    storage
                        .ref('images')
                        .child(imageName)
                        .getDownloadURL()
                        .then(url => {
                            addPost(caption, username, url)
                            })
                        setProgress(0);
                        setFile(null);
                        setCaption('');
                })
        
    }
    return (
        <div className="postupload">
            <Input id="fileinput" style={{ marginTop: "30px" }} className="child" type="file" name="upload-file" onChange={chooseFile}/>
            <progress className="child" max={100} value={progress}/>
            <Input className="child" type="text" name="upload-caption" placeholder="write your caption here"
                value={caption} onChange={(e)=>setCaption(e.target.value)}/>
            <Button 
                variant="contained" 
                style={{
                    backgroundColor: "#228B22",
                    padding: "10px 15px",
                    marginBottom: "30px",
                    color: 'white'
                }}
                variant="contained"
                className="child" onClick={uploadFile}
            >
                    Upload
            </Button>
            <div id="preview"></div>
        </div>
    )
}

export default PostUpload
