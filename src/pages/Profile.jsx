import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getDocumentFromFireStore, uploadImage, updateDocField } from '../services/firebaseService';
import SelectionPanel from '../components/SelectionPanel';
import InputPopUpForm from '../components/InputPopUpForm';
import { fetchFullRankingData, fetchLeaderBoardDataController } from '../services/fetchData';
import Board from '../components/Board';
import ProfileShimmer from '../components/ProfileShimmer';

function Profile() {
    const panelObj = {
        type: 'leaderboard',
        platforms: [
            {
                name: 'Atcoder',
                slug: 'at_coder',
            },
            {
                name: 'Codechef',
                slug: 'code_chef',
            },
            {
                name: 'Codeforces',
                slug: 'codeforces',
            },
            {
                name: 'Leetcode',
                slug: 'leet_code',
            },
        ],
        cornerButton: 'Add Handle',
    };

    const userData = useSelector((state) => state.auth.userData); // {uid,username,email}
    const [user, setUser] = useState(null); //{uid,username,imgurl}
    const [handles, setHandles] = useState(null);
    const [activePlatform, setActivePlatform] = useState('at_coder');
    const [addFriendPopUp, setAddfriendPopUp] = useState(false);
    const [myPlatformData, setMyPlatformData] = useState([]);
    const [lLoading, setlLoading] = useState(true);
    const [rLoading, setrLoading] = useState(true);
    const [isUploading, SetIsUploading] = useState(false)
    useEffect(() => {
        async function loadUser() {
            try {
                const [userF, handles] = await Promise.all([
                    getDocumentFromFireStore('users', userData.uid),
                    getDocumentFromFireStore('handles', userData.uid),
                ]);
                const obj = {
                    username: userData.username,
                    uid: userData.uid,
                    imgurl: userF.pic,
                };
                setHandles(handles.myhandles);
                setUser(obj);
            } catch (err) {
                console.log(err);
            } finally {
                setlLoading(false);
            }
        }
        loadUser();
    }, []);

    const trnasformData = (data) => {
        const res = {};
        const platformData = [];
        for (const key in data) {
            if (key == 'status') continue;
            if (key == 'stars') res[key.toLocaleUpperCase()] = `${data[key]} ⭐`;
            else res[key.toLocaleUpperCase()] = data[key] == '' ? '-' : data[key];
        }
        for (const key in res) {
            const obj = {
                row: [
                    {
                        text: key,
                        width: 'w-3/4',
                        ta: 'text-left',
                    },
                    {
                        text: res[key],
                        width: 'w-1/4',
                        ta: 'text-center',
                    },
                ],
            };
            platformData.push(obj);
        }
        return platformData;
    };

    useEffect(() => {
        async function loadHandles() {
            try {
                if (!handles) return;
                setMyPlatformData([]);
                const rankingData = await fetchFullRankingData(activePlatform, handles?.[activePlatform]);

                if (rankingData) {
                    const transformedData = trnasformData(activePlatform == 'codeforces' ? rankingData[0] : rankingData);
                    setMyPlatformData(transformedData);
                }
            } catch (err) { }
            finally {
                setrLoading(false);
            }
        }
        loadHandles();
    }, [JSON.stringify(handles), activePlatform]);

    const upLoadImage = async (e) => {
        SetIsUploading(true)
        try {
            const selectedFile = e.target.files[0];
            if (!selectedFile) {
                return;
            }
            const url = await uploadImage(selectedFile, userData.uid);
            await updateDocField('users', userData.uid, { pic: url });
            let obj = { ...user };
            obj.imgurl = url;
            setUser(obj);
        } catch (err) {
            console.log(err);
        } finally {
            SetIsUploading(false)
        }
    };

    const slectPlatform = (currPlatform) => {
        setrLoading(true);
        setAddfriendPopUp(false);
        setActivePlatform(currPlatform);
    };

    const showAddFriendPopup = async () => {
        setAddfriendPopUp(true);
    };

    const closePopUp = () => {
        setAddfriendPopUp(false);
    };

    const getPlatformSlug = (platform) => {
        if (platform.toLowerCase() == 'codechef') {
            return 'code_chef';
        } else if (platform.toLowerCase() == 'codeforces') {
            return 'codeforces';
        } else if (platform.toLowerCase() == 'leetcode') {
            return 'leet_code';
        } else if (platform.toLowerCase() == 'atcoder') {
            return 'at_coder';
        } else return null;
    };

    const isAddableAcc = async (platform, handle) => {
        const checkHandleExist = await fetchLeaderBoardDataController(platform, [handle]);
        let isUserExistOnPlatform = checkHandleExist.length && checkHandleExist[0].rating != null;
        let alreadyIncluded = false;
        if (handles?.[platform]) {
            alreadyIncluded = handles?.[platform]?.toLowerCase() == handle.toLowerCase();
        }
        return [isUserExistOnPlatform, alreadyIncluded];
    };

    const handleAddHandlepopupBtn = async (data) => {
        try {
            const platform = getPlatformSlug(data.platform);
            const handle = data.handle.trim();
            const isAddable = await isAddableAcc(platform, handle);
            if (isAddable[0]) {
                if (isAddable[1]) {
                    setAddfriendPopUp(false);
                    return;
                }
                const newHandles = { ...handles };
                newHandles[platform] = handle;
                await updateDocField('handles', userData.uid, { myhandles: newHandles });
                setHandles(newHandles);
                setAddfriendPopUp(false);
            } else {
                throw new Error(`Handle ${handle} does not exist on ${platform}`);
            }
        } catch (err) {
            console.log(err);
            throw err;
        }
    };

    return (
        <>
            <div className='h-[700px] p-10 text-white flex items-center justify-center lg:hidden'>
                <p className='text-lg'>
                    This feature is not compatible with small screens. Download our Android app for a seamless
                    experience.{' '}
                    <a
                        className='text-blue cursor-pointer'
                        href='https://play.google.com/store/apps/details?id=com.parsanatech.crazycoder&hl=en&gl=US'
                    >
                        Click Here
                    </a>
                </p>
            </div>
            <div className='hidden lg:flex w-full items-start h-screen'>
                {lLoading ? <ProfileShimmer lLoading={true} /> :
                    (<div className='w-2/5 flex-1  h-full'>
                        <div className='flex py-10 px-6'>
                            <div className='relative h-48 w-48'>
                                    <div role="status" className={`${isUploading ? "flex" : "hidden"} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 w-full h-full rounded-full items-center justify-center`}>
                                        <svg aria-hidden="true" class="w-8 h-8 text-[#707070] animate-spin fill-white" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                        </svg>
                                        <span class="sr-only">Loading...</span>
                                    </div>
                                 <img
                                    className='h-full w-full rounded-full object-cover object-center '
                                    src={`${user?.imgurl ?? './blueuser.svg'}`}
                                />
                                <img
                                    className=' absolute bottom-0 right-5 h-10 rounded-full bg-white cursor-pointer'
                                    src='./add.svg'
                                    onClick={() => {
                                        document.getElementById('fileInput').click();
                                    }}
                                />
                                <input
                                    id='fileInput'
                                    type='file'
                                    accept='image/*'
                                    className='hidden'
                                    onChange={upLoadImage}
                                />
                            </div>
                            <div className='flex-1 py-10 ml-8'>
                                <p className='text-white text-3xl'>👑 {user?.username}</p>
                                <div className='flex my-3'>
                                    {handles?.at_coder && (
                                        <a target='_blank' href={`https://atcoder.jp/users/${handles.at_coder}`}>
                                            <img className='h-9 pr-4 cursor-pointer' src='./atcoder.png' />
                                        </a>
                                    )}
                                    {handles?.code_chef && (
                                        <a target='_blank' href={`https://www.codechef.com/users/${handles.code_chef}`}>
                                            <img className='h-9 pr-4 cursor-pointer' src='./codechef.svg' />
                                        </a>
                                    )}
                                    {handles?.codeforces && (
                                        <a
                                            target='_blank'
                                            href={`https://codeforces.com/profile/${handles.codeforces}`}
                                        >
                                            <img className='h-9 pr-4 cursor-pointer' src='./codeforces.svg' />
                                        </a>
                                    )}
                                    {handles?.leet_code && (
                                        <a target='_blank' href={`https://leetcode.com/${handles.leet_code}`}>
                                            <img className='h-9 pr-4 cursor-pointer' src='./leetcode.svg' />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    )}
                <div className='w-3/5 flex-1 py-10'>
                    <SelectionPanel
                        {...panelObj}
                        activePlatform={activePlatform}
                        slectPlatform={slectPlatform}
                        cornerBtnClickFun={showAddFriendPopup}
                    />
                    {rLoading && <ProfileShimmer rLoading={true} />}
                    {!rLoading &&
                        !addFriendPopUp &&
                        (myPlatformData.length ? (
                            <div className='flex flex-col min-h-96 lg:min-h-screen'>
                                {myPlatformData.map((obj, index) => (
                                    <Board key={index} {...obj} px='' />
                                ))}
                            </div>
                        ) : (
                            <div className='min-h-96 lg:min-h-screen flex flex-col py-24 px-8'>
                                <h1 className='text-white text-2xl text-center h-fit'>
                                    Please add your and your friend's platform handles.
                                </h1>
                                <h2 className='text-white text-lg text-center h-fit p-2'>
                                    You can add your handle in profile section and your friend's handle at top left
                                    corner.
                                </h2>
                            </div>
                        ))}

                    {addFriendPopUp && (
                        <div className='w-full bg-transparent fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
                            <InputPopUpForm
                                title={'Add Your Handle'}
                                element={{ label: 'User Handle', placeholder: ' ', field: 'handle' }}
                                optionManu={true}
                                btnClick={handleAddHandlepopupBtn}
                                closeBtn={closePopUp}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default Profile;
