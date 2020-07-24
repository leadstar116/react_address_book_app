import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { ThunkDispatch } from 'redux-thunk'
import { AnyAction } from 'redux'
import { loadUsers, updateUsers } from '../_helpers/user.thunk'
import { UserInfo } from '../_constants/users.interface'
import User from './User'
import { AlertData } from '../_constants/alert.interface'
import { LocationSettings } from '../_constants/settings.interface'
import { alertSuccess } from '../_actions/alert.actions'

type Props = {
    searchString: string,
    userList: UserData,
    alertState: AlertData,
    settings: settingsState,
    callLoadUsers: (userCount: number, nationality: string) => {},
    callUpdateUsers: () => {},
    showEndAlert: (message: string) => {}
}
const UserList = ({
        userList,
        callLoadUsers,
        settings,
        callUpdateUsers,
        showEndAlert,
        searchString,
        ...props
    }: Props) => {

    const [isFetching, setIsFetching] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)

    const usersCount = 50
    const maxUsersCount = 1000

    // Preload users
    useEffect(() => {
        if(userList.isPreloaded)
            return
        callLoadUsers(usersCount, settings.location.nationality)
    }, [callLoadUsers, userList, settings, usersCount])

    // Initialize users at first load
    useEffect(() => {
        if(!userList.isPreloaded
            || isInitialized
            || userList.users.length)
            return
        callUpdateUsers()
        setIsInitialized(true)
    }, [userList, callUpdateUsers, isInitialized, usersCount])

    // Add preloaded users to users list when scrolling
    useEffect(() => {
        if(!isFetching || searchString)
            return
        if(userList.users.length >= maxUsersCount) {
            showEndAlert('End of users catalog')
            return
        }
        callUpdateUsers()
        setIsFetching(false)
    }, [userList, callUpdateUsers, showEndAlert, isFetching, searchString])

    // Handle scroll
    function handleScroll() {
        if ((window.innerHeight + document.documentElement.scrollTop) !== document.documentElement.offsetHeight)
            return
        setIsFetching(true)
    }

    // Setup scroll event
    useEffect(() => {
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const filtereUsersWithSearchKey = () => {
        return userList.users.filter((user) => {
            const name = user.name.first + user.name.last as string
            return name.split(' ').join('').toLowerCase().includes(
                searchString.split(' ').join('').toLowerCase()
            )
        })
    }

    const filteredUsers = filtereUsersWithSearchKey()
    console.log(filteredUsers)

    return (
        <div className="p-2">
            {
                filteredUsers.map((user, index) => (
                    <User data={user} key={index}/>
                ))
            }
            {props.alertState !== undefined &&
                <div className={props.alertState.alertClass}>
                    {props.alertState.alertMessage}
                </div>
            }
            {(!filteredUsers.length && userList.users.length)
                ? (<div className="alert alert-danger text-center">
                    Sorry, we couldn't find a user with that name
                    </div>)
                : ''
            }
        </div>
    )
}

interface UserData {
    users: UserInfo[],
    isPreloaded: boolean
}
interface settingsState {
    location: LocationSettings
}

const mapStateToProps = (state: {
        usersReducer: UserData,
        alertReducer: AlertData,
        settingsReducer: settingsState,
    }) => ({
    userList: state.usersReducer,
    settings: state.settingsReducer,
    alertState: state.alertReducer
})

const mapDispatchToProps = (dispatch: ThunkDispatch<any, any, AnyAction>) => ({
    callLoadUsers: (userCount = 50, nationality="") => dispatch(loadUsers(userCount, nationality)),
    callUpdateUsers: () => dispatch(updateUsers()),
    showEndAlert: (message: string) => dispatch(alertSuccess(message)),
})

export default connect(mapStateToProps, mapDispatchToProps)(UserList)