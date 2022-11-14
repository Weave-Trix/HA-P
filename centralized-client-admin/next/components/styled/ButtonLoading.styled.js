import React from 'react'
import { ENSAvatar, Tab, TabList, Table, EmptyRowsForSkeletonTable, Button, Loading, useNotification } from "web3uikit";

const ButtonLoading = () => {
  return (
    <Button
        icon={
            <Loading
            size={12}
            spinnerColor="#ffffff"
            spinnerType="wave"
            />
        }
        disabled
        text=""
        theme="primary"
        color="green"
        type="submit"
        size="xl"
    />
  )
}

export default ButtonLoading